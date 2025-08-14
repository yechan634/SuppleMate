#!/usr/bin/env node

/**
 * Script to populate the drug_interactions database using webscraper
 * This script should be run manually or via GitHub Actions to update the database
 * with new drug interaction data from external sources.
 */

import axios from 'axios';
import dotenv from 'dotenv';
import { JSDOM } from 'jsdom';
import path from 'path';
import pkg from 'pg';
import { fileURLToPath } from 'url';

dotenv.config();

const { Pool } = pkg;

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
  ssl: {
    rejectUnauthorized: false
  },
});

// Helper function to normalize drug names for matching
const normalizeDrugName = (name) => {
  return name
    .toLowerCase()
    .replace(/\s+/g, '')
    .replace(/[-_]/g, '')
    .replace(/vitamin\s*d3?/g, 'vitd')
    .replace(/vitamin\s*d/g, 'vitd')
    .replace(/vitamin\s*e/g, 'vitamine')
    .replace(/vitamin\s*c/g, 'vitc')
    .replace(/vitamin\s*b12/g, 'vitb12')
    .replace(/vitamin\s*b6/g, 'vitb6')
    .replace(/vitamin\s*b/g, 'vitb')
    .replace(/vitamin/g, 'vit')
    .replace(/omega[\s-]*3/g, 'omega3')
    .replace(/coq[\s-]*10/g, 'coenzyme q10')
    .replace(/coenzyme[\s]*q[\s]*10/g, 'coenzyme q10')
    .replace(/b[\s-]*12/g, 'vitb12')
    .replace(/d[\s-]*3/g, 'vitd')
    .replace(/magnesium/g, 'mg')
    .replace(/calcium/g, 'ca')
    .replace(/potassium/g, 'potassium')
    .replace(/iron/g, 'iron')
    .replace(/zinc/g, 'zinc')
    .replace(/fish[\s]*oil/g, 'omega3')
    .replace(/st\.?\s*john'?s\s*wort/g, 'stjohnswort')
    .replace(/milk[\s]*thistle/g, 'milkthistle')
    .replace(/ginkgo[\s]*biloba/g, 'ginkgo')
    .replace(/turmeric/g, 'turmeric')
    .replace(/curcumin/g, 'turmeric')
    .replace(/garlic/g, 'garlic')
    .replace(/ginger/g, 'ginger')
    .replace(/ginseng/g, 'ginseng')
    .replace(/echinacea/g, 'echinacea')
    .replace(/biotin/g, 'biotin')
    .replace(/chromium/g, 'chromium')
    .replace(/niacin/g, 'niacin')
    .replace(/tryptophan/g, 'tryptophan');
};

// Function to scrape interactions directly from BNF website
const scrapeInteractions = async (drug, checkingDrugs = null, baseUrl = "https://bnf.nice.org.uk/interactions/") => {
  try {
    const url = `${baseUrl}${drug.replace(/\s+/g, "-")}`;
    console.log(`    Scraping interactions for ${drug} from: ${url}`);

    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      timeout: 30000
    });

    const dom = new JSDOM(response.data);
    const document = dom.window.document;

    const interactions = [];

    // Look for the interactions list - try multiple selectors
    let olElement = document.querySelector('ol[class*="interactionsList"]');
    if (!olElement) {
      olElement = document.querySelector('ol.interactions-list');
    }
    if (!olElement) {
      olElement = document.querySelector('.interactions ol');
    }
    if (!olElement) {
      // Try to find any ol element that might contain interactions
      const allOls = document.querySelectorAll('ol');
      for (const ol of allOls) {
        if (ol.className && ol.className.includes('interaction')) {
          olElement = ol;
          break;
        }
      }
    }

    if (!olElement) {
      console.log(`    No interactions list found for ${drug}`);
      return [];
    }

    const listItems = olElement.querySelectorAll('li');

    for (const li of listItems) {
      const interaction = {};
      const h3 = li.querySelector('h3');

      if (h3) {
        const aTag = h3.querySelector('a');
        let otherDrug;

        // Get other drug name
        if (aTag) {
          otherDrug = aTag.textContent.trim().toLowerCase();
        } else {
          // Some drugs in the interaction list don't have a href link
          otherDrug = h3.textContent.trim().toLowerCase();
        }

        // Filter by checking drugs if specified
        if (checkingDrugs && !checkingDrugs.includes(otherDrug)) {
          continue;
        }

        // Sort drug names alphabetically for consistent storage
        const [fstDrug, sndDrug] = [drug.toLowerCase(), otherDrug].sort();
        interaction.fst_drug = fstDrug;
        interaction.snd_drug = sndDrug;

        // Get description
        const ulElement = li.querySelector('ul');
        if (!ulElement) {
          continue;
        }

        const pElement = ulElement.querySelector('p');
        if (!pElement) {
          continue;
        }
        interaction.description = pElement.textContent.trim();

        // Get severity
        const liElement = ulElement.querySelector('li');
        if (!liElement) {
          continue;
        }

        const ddElement = liElement.querySelector('dd');
        if (!ddElement) {
          continue;
        }

        let severity = ddElement.textContent.trim().toLowerCase();
        // Normalize severity values
        if (severity.includes('severe') || severity.includes('contraindicated') || severity.includes('major')) {
          severity = 'severe';
        } else if (severity.includes('moderate')) {
          severity = 'moderate';
        } else if (severity.includes('mild') || severity.includes('minor')) {
          severity = 'mild';
        } else {
          severity = 'unknown';
        }
        interaction.severity = severity;

        interactions.push(interaction);
      }
    }

    console.log(`    Found ${interactions.length} interactions for ${drug}`);
    return interactions;
  } catch (error) {
    console.error(`    Error scraping interactions for ${drug}:`, error.message);
    return [];
  }
};

// Get list of common drugs to check interactions for
const getCommonDrugs = async () => {
  try {
    // Get drugs from supplement_info table
    const supplementResult = await pool.query(
      'SELECT DISTINCT name FROM supplement_info'
    );

    // Get drugs from user supplements/medications  
    const userDrugsResult = await pool.query(
      'SELECT DISTINCT name FROM supplements WHERE created_at > NOW() - INTERVAL \'6 months\''
    );

    const supplements = supplementResult.rows.map(row => row.name.toLowerCase());
    const userDrugs = userDrugsResult.rows.map(row => row.name.toLowerCase());

    // Combine and add common prescription drugs
    const commonPrescriptionDrugs = [
      'warfarin', 'aspirin', 'ibuprofen', 'acetaminophen', 'lisinopril',
      'amlodipine', 'metformin', 'atorvastatin', 'simvastatin', 'levothyroxine',
      'omeprazole', 'metoprolol', 'losartan', 'hydrochlorothiazide', 'gabapentin',
      'sertraline', 'fluoxetine', 'citalopram', 'escitalopram', 'duloxetine',
      'trazodone', 'alprazolam', 'lorazepam', 'clonazepam', 'zolpidem'
    ];

    const allDrugs = [...new Set([...supplements, ...userDrugs, ...commonPrescriptionDrugs])];
    console.log(`Found ${allDrugs.length} unique drugs to check interactions for`);

    return allDrugs;
  } catch (error) {
    console.error('Error getting common drugs:', error);
    return [];
  }
};

// Function to populate interactions for a specific drug
const populateInteractionsForDrug = async (mainDrug, checkDrugs) => {
  try {
    console.log(`\n🔍 Checking interactions for ${mainDrug} against ${checkDrugs.length} other drugs...`);

    const interactions = await scrapeInteractions(mainDrug, checkDrugs);

    if (interactions.length === 0) {
      console.log(`  ✅ No interactions found for ${mainDrug}`);
      return 0;
    }

    let insertedCount = 0;

    for (const interaction of interactions) {
      try {
        const normalizedFst = normalizeDrugName(interaction.fst_drug);
        const normalizedSnd = normalizeDrugName(interaction.snd_drug);
        const [fstDrug, sndDrug] = [normalizedFst, normalizedSnd].sort();

        // Map severity to our expected format
        let mappedSeverity = 'mild';
        if (interaction.severity) {
          const severity = interaction.severity.toLowerCase();
          if (severity.includes('severe') || severity.includes('major') || severity.includes('contraindicated')) {
            mappedSeverity = 'strong';
          } else if (severity.includes('moderate')) {
            mappedSeverity = 'strong';
          } else {
            mappedSeverity = 'mild';
          }
        }

        await pool.query(`
          INSERT INTO drug_interactions (fst_drug, snd_drug, severity, description, last_updated)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (fst_drug, snd_drug) 
          DO UPDATE SET 
            severity = EXCLUDED.severity,
            description = EXCLUDED.description,
            last_updated = EXCLUDED.last_updated
        `, [fstDrug, sndDrug, mappedSeverity, interaction.description, new Date()]);

        insertedCount++;
        console.log(`  ✅ Stored: ${fstDrug} + ${sndDrug} (${mappedSeverity})`);

      } catch (dbError) {
        console.error(`  ❌ Database error for interaction:`, dbError.message);
      }
    }

    console.log(`  📊 Processed ${insertedCount} interactions for ${mainDrug}`);
    return insertedCount;

  } catch (error) {
    console.error(`❌ Error processing ${mainDrug}:`, error.message);
    return 0;
  }
};

// Main function to populate the database
const populateDatabase = async () => {
  console.log('🚀 Starting drug interactions database population...');

  try {
    const drugs = await getCommonDrugs();

    if (drugs.length === 0) {
      console.log('❌ No drugs found to process');
      return;
    }

    let totalInteractions = 0;
    let processedDrugs = 0;

    // Process drugs in batches to avoid overwhelming the scraper
    const batchSize = 5;

    for (let i = 0; i < drugs.length; i += batchSize) {
      const batch = drugs.slice(i, i + batchSize);

      console.log(`\n📦 Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(drugs.length / batchSize)}`);

      for (const drug of batch) {
        // Get remaining drugs to check against (avoid duplicates)
        const checkDrugs = drugs.slice(drugs.indexOf(drug) + 1);

        if (checkDrugs.length > 0) {
          const count = await populateInteractionsForDrug(drug, checkDrugs);
          totalInteractions += count;
          processedDrugs++;

          // Add small delay between requests to be respectful to the source
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }

      // Longer delay between batches
      if (i + batchSize < drugs.length) {
        console.log('⏳ Waiting 10 seconds before next batch...');
        await new Promise(resolve => setTimeout(resolve, 10000));
      }
    }

    console.log(`\n🎉 Database population complete!`);
    console.log(`📊 Statistics:`);
    console.log(`  - Processed drugs: ${processedDrugs}`);
    console.log(`  - Total interactions stored: ${totalInteractions}`);

    // Show current database statistics
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_interactions,
        COUNT(CASE WHEN severity = 'strong' THEN 1 END) as strong_interactions,
        COUNT(CASE WHEN severity = 'mild' THEN 1 END) as mild_interactions,
        COUNT(CASE WHEN severity = 'none' THEN 1 END) as no_interactions
      FROM drug_interactions
    `);

    const stats = statsResult.rows[0];
    console.log(`  - Database total: ${stats.total_interactions} interactions`);
    console.log(`  - Strong: ${stats.strong_interactions}, Mild: ${stats.mild_interactions}, None: ${stats.no_interactions}`);

  } catch (error) {
    console.error('❌ Error during database population:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
};

// Handle command line arguments
const args = process.argv.slice(2);
const forceMode = args.includes('--force');
const singleDrug = args.find(arg => arg.startsWith('--drug='))?.split('=')[1];

if (singleDrug) {
  console.log(`🎯 Processing single drug: ${singleDrug}`);
  (async () => {
    try {
      const drugs = await getCommonDrugs();
      await populateInteractionsForDrug(singleDrug, drugs);
      console.log('✅ Single drug processing complete');
      process.exit(0);
    } catch (error) {
      console.error('❌ Single drug processing failed:', error);
      process.exit(1);
    } finally {
      await pool.end();
    }
  })();
} else {
  populateDatabase();
}

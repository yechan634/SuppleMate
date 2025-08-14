import requests
from bs4 import BeautifulSoup
from enum import StrEnum
import json
import sys

class InteractionAttributes(StrEnum):
	FST_DRUG = "fst_drug"
	SND_DRUG = "snd_drug"
	SEVERITY = "severity"
	DESCRIPTION = "description"

class Severity(StrEnum):
	SEVERE = "severe"
	MODERATE = "moderate"
	MILD = "mild"
	UNKNOWN = "unknown"


# assume drug, checkingDrugs are all lowercase
# checkingDrugs = None finds all interactions
def getInteractions(drug: str, checkingDrugs: set[str] = None, baseUrl = "https://bnf.nice.org.uk/interactions/") -> list[dict]:
	# need to replace spaces between each word of drug with - in url
	try:
		res = requests.get(f"{baseUrl}/{drug.replace(' ', '-')}", timeout=30)
		res.raise_for_status()
	except requests.RequestException as e:
		print(f"Error fetching data for {drug}: {e}", file=sys.stderr)
		return []

	soup = BeautifulSoup(res.text, 'html.parser')

	interactions = []
	ol_element = soup.find("ol", class_="{BnfInteractant-slug}-module--interactionsList--af253")

	if not ol_element:
		# Try alternative selectors
		ol_element = soup.find("ol", attrs={"class": lambda x: x and "interactionsList" in x})
		
	if not ol_element:
		return []

	for li in ol_element.find_all("li"):
		inter = {}
		h3 = li.find("h3")
		if h3:
			a_tag = h3.find("a")

			# getting other drug name
			if (a_tag):
				other_drug = a_tag.get_text(strip=True).lower()
			else:
				# some drugs in the interaction list don't have a href link
				other_drug = h3.get_text(strip=True).lower()


			if (checkingDrugs is not None) and (other_drug not in checkingDrugs):
				continue

			[fst_drug, snd_drug] = sorted([drug, other_drug])
			inter[InteractionAttributes.FST_DRUG.value] = fst_drug
			inter[InteractionAttributes.SND_DRUG.value] = snd_drug

			ul_element = li.find("ul")
			if not ul_element:
				continue
				
			p = ul_element.find("p")
			if (not p):
				continue
			inter[InteractionAttributes.DESCRIPTION.value] = p.get_text(strip=True)
			
			li_element = ul_element.find("li")
			if not li_element:
				continue
				
			dd = li_element.find("dd")
			if (not dd):
				continue

			inter[InteractionAttributes.SEVERITY.value] = dd.get_text(strip=True)
			interactions.append(inter)
	return interactions

if __name__ == "__main__":
	if len(sys.argv) < 2:
		print("Usage: python main.py <drug> [checking_drugs_json]", file=sys.stderr)
		sys.exit(1)
	
	drug = sys.argv[1].lower()
	checking_drugs = None
	
	if len(sys.argv) > 2:
		try:
			checking_drugs_list = json.loads(sys.argv[2])
			checking_drugs = set(drug.lower() for drug in checking_drugs_list)
		except json.JSONDecodeError:
			print("Error: checking_drugs must be valid JSON array", file=sys.stderr)
			sys.exit(1)
	
	try:
		interactions = getInteractions(drug=drug, checkingDrugs=checking_drugs, baseUrl="https://bnf.nice.org.uk/interactions/")
		print(json.dumps(interactions, indent=2))
	except Exception as e:
		print(f"Error: {e}", file=sys.stderr)
		sys.exit(1)

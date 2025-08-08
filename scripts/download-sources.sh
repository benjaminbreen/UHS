#!/bin/bash

# Primary Sources Download Script
# Downloads PDFs from Internet Archive

echo "🚀 Starting Primary Sources Download..."

# Create directories
mkdir -p ./primary-sources-data/{pdfs,metadata,text}

# Function to download from Internet Archive
download_source() {
  local identifier=$1
  local title=$2
  
  echo "📥 Downloading: $title ($identifier)"
  
  # Check if already downloaded
  if [ -f "./primary-sources-data/pdfs/${identifier}.pdf" ]; then
    echo "  ✓ Already downloaded, skipping..."
    return
  fi
  
  # Download PDF
  if wget -q --show-progress "https://archive.org/download/${identifier}/${identifier}.pdf" \
    -O "./primary-sources-data/pdfs/${identifier}.pdf" 2>/dev/null; then
    echo "  ✓ PDF downloaded"
  else
    # Try alternative naming patterns
    echo "  ⚠ Standard naming failed, trying alternatives..."
    
    # Try with _text suffix
    if wget -q --show-progress "https://archive.org/download/${identifier}/${identifier}_text.pdf" \
      -O "./primary-sources-data/pdfs/${identifier}.pdf" 2>/dev/null; then
      echo "  ✓ PDF downloaded (text version)"
    else
      echo "  ❌ Failed to download PDF"
    fi
  fi
  
  # Download metadata JSON
  if wget -q "https://archive.org/metadata/${identifier}" \
    -O "./primary-sources-data/metadata/${identifier}.json" 2>/dev/null; then
    echo "  ✓ Metadata downloaded"
  else
    echo "  ⚠ Metadata download failed"
  fi
  
  echo ""
}

# Ancient Era Sources
echo "═══════════════════════════════════════"
echo "📚 ANCIENT ERA"
echo "═══════════════════════════════════════"

# Ancient Egypt
download_source "bookofdeadpapyru00budgrich" "Book of the Dead"
download_source "taleofshipwrecke00good" "Tale of the Shipwrecked Sailor"
download_source "maximsofptahhotep00ptu" "Maxims of Ptahhotep"

# Ancient Greece
download_source "historiesofhero01hero" "Histories by Herodotus"
download_source "historyofpelopon00thucuoft" "Peloponnesian War"
download_source "hesiodworkscall00hesi" "Works and Days"

# Ancient Rome
download_source "caesarsgallicwa00caes" "Gallic Wars"
download_source "historiesofcorn01taci" "Histories by Tacitus"
download_source "marcusporciuscato00cato" "On Agriculture"
download_source "livesoffirsttwel00suet" "The Twelve Caesars"

# Ancient China
download_source "artofwarsuntzu00sunt" "Art of War"
download_source "recordsofgrandhi00sima" "Records of Grand Historian"
download_source "analectsconfuciu00conf" "Analects of Confucius"

# Ancient India
download_source "rigvedasanhitc00wils" "Rigveda"
download_source "kautilyasarthas00shamuoft" "Arthashastra"
download_source "lawsofmanu00bh" "Laws of Manu"

echo "═══════════════════════════════════════"
echo "📚 MEDIEVAL ERA"
echo "═══════════════════════════════════════"

# Medieval Europe
download_source "domesdaybookstud01drap" "Domesday Book Study"
download_source "anglosaxonchroni00gile" "Anglo-Saxon Chronicle"
download_source "alexiadofprince00comn" "Alexiad of Anna Comnena"
download_source "travelsofmarcopo00polouoft" "Travels of Marco Polo"
download_source "gestafrancorum00unknuoft" "Deeds of the Franks"

# Islamic Golden Age
download_source "muqaddimahintroto01ibnk" "Muqaddimah"
download_source "canonofmedicineo01avic" "Canon of Medicine"
download_source "travelsinasiandr00ibnb" "Travels of Ibn Battuta"

# Mesoamerica
download_source "generhistoryof01sahauoft" "Florentine Codex"

echo "═══════════════════════════════════════"
echo "📚 RENAISSANCE & EARLY MODERN"
echo "═══════════════════════════════════════"

# Italian Renaissance
download_source "prince00machuoft" "The Prince"
download_source "livesofmostemin01vasauoft" "Lives of Artists"
download_source "bookofcourtierfr00cast" "Book of the Courtier"

# Reformation
download_source "firstprincipleso00luth" "Luther's Works"

# Age of Exploration
download_source "journalofchristo00colu" "Journal of Columbus"
download_source "devastationofind00lasc" "Destruction of Indies"

echo "═══════════════════════════════════════"
echo "📚 SPECIALIZED SOURCES"
echo "═══════════════════════════════════════"

# Professional and Technical
download_source "fourebookesofhus00here" "Four Books of Husbandry"
download_source "blacksmithsgui00sall" "Blacksmith's Guide"
download_source "practicalblacks02richgoog" "Practical Blacksmithing"

# Law and Governance
download_source "codeofhammurabi00hamm" "Code of Hammurabi"
download_source "magnacartaacomme00mcdo" "Magna Carta"

# Science and Technology
download_source "derevolutionibus00cope" "On Heavenly Spheres"
download_source "notebooksofleonar01leon" "Leonardo's Notebooks"

# Medicine
download_source "onfabricofhumanb00vesa" "Human Body by Vesalius"

echo "═══════════════════════════════════════"
echo "✅ Download Complete!"
echo "═══════════════════════════════════════"

# Count downloaded files
pdf_count=$(ls -1 ./primary-sources-data/pdfs/*.pdf 2>/dev/null | wc -l)
echo "📊 Downloaded $pdf_count PDF files"

# Check for failed downloads
echo ""
echo "📋 Checking for missing files..."
missing=0
for file in ./primary-sources-data/metadata/*.json; do
  basename=$(basename "$file" .json)
  if [ ! -f "./primary-sources-data/pdfs/${basename}.pdf" ]; then
    echo "  ⚠️  Missing PDF: $basename"
    ((missing++))
  fi
done

if [ $missing -eq 0 ]; then
  echo "  ✅ All PDFs downloaded successfully!"
else
  echo "  ⚠️  $missing PDFs failed to download"
  echo "  These may need manual download or have different naming conventions"
fi
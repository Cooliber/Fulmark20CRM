#!/bin/bash

# PrimeReact to Native Components Migration Script
# "Pasja rodzi profesjonalizm" - Bundle Size Optimization

echo "🚀 Starting PrimeReact to Native Components Migration..."
echo "Target: Reduce bundle size by ~1.08MB"

# Define the HVAC modules directory
HVAC_DIR="packages/twenty-front/src/modules/hvac"

# Function to replace imports in a file
replace_imports() {
    local file="$1"
    echo "Processing: $file"
    
    # Replace PrimeReact DataTable imports
    sed -i "s/import { DataTable } from 'primereact\/datatable';/import { HvacTable as DataTable } from '.\/ui\/HvacNativeComponents';/g" "$file"
    sed -i "s/import { Column } from 'primereact\/column';/\/\/ Column component integrated into HvacTable/g" "$file"
    
    # Replace PrimeReact Card imports
    sed -i "s/import { Card } from 'primereact\/card';/import { HvacCard as Card } from '.\/ui\/HvacNativeComponents';/g" "$file"
    
    # Replace PrimeReact Calendar imports
    sed -i "s/import { Calendar } from 'primereact\/calendar';/import { HvacCalendar as Calendar } from '.\/ui\/HvacNativeComponents';/g" "$file"
    
    # Replace PrimeReact Chart imports
    sed -i "s/import { Chart } from 'primereact\/chart';/import { HvacBarChart as Chart } from '.\/ui\/HvacChartComponents';/g" "$file"
    
    # Replace PrimeReact Button imports (use TwentyCRM Button)
    sed -i "s/import { Button } from 'primereact\/button';/import { Button } from 'twenty-ui\/input';/g" "$file"
    
    # Replace other common PrimeReact components
    sed -i "s/import { Dropdown } from 'primereact\/dropdown';/import { Dropdown } from '.\/ui\/PrimeReactReplacements';/g" "$file"
    sed -i "s/import { InputText } from 'primereact\/inputtext';/import { InputText } from '.\/ui\/PrimeReactReplacements';/g" "$file"
    sed -i "s/import { Toast } from 'primereact\/toast';/\/\/ Toast replaced with native implementation/g" "$file"
    sed -i "s/import { ConfirmDialog } from 'primereact\/confirmdialog';/import { ConfirmDialog } from '.\/ui\/PrimeReactReplacements';/g" "$file"
    
    # Remove unused PrimeReact imports
    sed -i "/import.*from 'primereact\/skeleton';/d" "$file"
    sed -i "/import.*from 'primereact\/progressspinner';/d" "$file"
    sed -i "/import.*from 'primereact\/badge';/d" "$file"
    sed -i "/import.*from 'primereact\/message';/d" "$file"
    sed -i "/import.*from 'primereact\/panel';/d" "$file"
    sed -i "/import.*from 'primereact\/tabview';/d" "$file"
    sed -i "/import.*from 'primereact\/tag';/d" "$file"
    sed -i "/import.*from 'primereact\/chip';/d" "$file"
    sed -i "/import.*from 'primereact\/rating';/d" "$file"
    sed -i "/import.*from 'primereact\/knob';/d" "$file"
    sed -i "/import.*from 'primereact\/progressbar';/d" "$file"
    sed -i "/import.*from 'primereact\/avatar';/d" "$file"
}

# Find all TypeScript/TSX files in HVAC modules
find "$HVAC_DIR" -name "*.tsx" -o -name "*.ts" | while read -r file; do
    # Skip our native components files
    if [[ "$file" == *"HvacNativeComponents"* ]] || [[ "$file" == *"HvacChartComponents"* ]] || [[ "$file" == *"PrimeReactReplacements"* ]]; then
        continue
    fi
    
    # Check if file contains PrimeReact imports
    if grep -q "primereact" "$file"; then
        replace_imports "$file"
        echo "✅ Updated: $file"
    fi
done

echo ""
echo "🎯 Migration Summary:"
echo "- Replaced PrimeReact DataTable with HvacTable"
echo "- Replaced PrimeReact Card with HvacCard"
echo "- Replaced PrimeReact Calendar with HvacCalendar"
echo "- Replaced PrimeReact Chart with HvacBarChart"
echo "- Replaced PrimeReact Button with TwentyCRM Button"
echo "- Removed unused PrimeReact components"
echo ""
echo "📊 Expected Bundle Size Reduction: ~1.08MB"
echo "🎉 Migration completed! Run 'npm run build' to verify bundle size reduction."

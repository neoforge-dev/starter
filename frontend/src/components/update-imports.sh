#!/bin/bash

# Function to update imports in a file
update_imports() {
    local file=$1
    echo "Updating imports in $file..."
    
    # Update atom imports
    sed -i '' 's|from "../ui/button"|from "../atoms/button"|g' $file
    sed -i '' 's|from "../ui/input"|from "../atoms/input"|g' $file
    sed -i '' 's|from "../ui/badge"|from "../atoms/badge"|g' $file
    sed -i '' 's|from "../ui/spinner"|from "../atoms/spinner"|g' $file
    sed -i '' 's|from "../ui/checkbox"|from "../atoms/checkbox"|g' $file
    sed -i '' 's|from "../ui/radio"|from "../atoms/radio"|g' $file
    sed -i '' 's|from "../ui/dropdown"|from "../atoms/dropdown"|g' $file
    
    # Update molecule imports
    sed -i '' 's|from "../ui/card"|from "../molecules/card"|g' $file
    sed -i '' 's|from "../ui/breadcrumbs"|from "../molecules/breadcrumbs"|g' $file
    sed -i '' 's|from "../ui/tabs"|from "../molecules/tabs"|g' $file
    sed -i '' 's|from "../ui/date-picker"|from "../molecules/date-picker"|g' $file
    sed -i '' 's|from "../ui/select"|from "../molecules/select"|g' $file
    sed -i '' 's|from "../ui/phone-input"|from "../molecules/phone-input"|g' $file
    sed -i '' 's|from "../ui/language-selector"|from "../molecules/language-selector"|g' $file
    
    # Update organism imports
    sed -i '' 's|from "../ui/modal"|from "../organisms/modal"|g' $file
    sed -i '' 's|from "../ui/toast"|from "../organisms/toast"|g' $file
    sed -i '' 's|from "../ui/data-table"|from "../organisms/data-table"|g' $file
    sed -i '' 's|from "../ui/file-upload"|from "../organisms/file-upload"|g' $file
    sed -i '' 's|from "../ui/rich-text-editor"|from "../organisms/rich-text-editor"|g' $file
    sed -i '' 's|from "../ui/charts"|from "../organisms/charts"|g' $file
    sed -i '' 's|from "../ui/form"|from "../organisms/form"|g' $file
    sed -i '' 's|from "../ui/pagination"|from "../organisms/pagination"|g' $file
    
    # Update design token imports
    sed -i '' 's|from "../theme/"|from "../tokens/design-tokens"|g' $file
}

# Update imports in all component files
find . -type f -name "*.js" ! -name "*.test.js" ! -name "*.stories.js" -exec bash -c 'update_imports "$0"' {} \;

echo "Import paths updated successfully!" 
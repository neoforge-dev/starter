#!/bin/bash

# Create atomic design directories if they don't exist
mkdir -p atoms molecules organisms templates pages tokens patterns

# Move Atoms
echo "Moving atomic components..."
mv ui/button.* atoms/
mv ui/input.* atoms/
mv ui/badge.* atoms/
mv ui/spinner.* atoms/
mv ui/checkbox.* atoms/
mv ui/radio.* atoms/
mv ui/dropdown.* atoms/

# Move Molecules
echo "Moving molecular components..."
mv ui/card.* molecules/
mv ui/breadcrumbs.* molecules/
mv ui/tabs.* molecules/
mv ui/date-picker.* molecules/
mv ui/select.* molecules/
mv ui/phone-input.* molecules/
mv ui/language-selector.* molecules/

# Move Organisms
echo "Moving organism components..."
mv ui/modal.* organisms/
mv ui/modal-dialog.* organisms/
mv ui/toast.* organisms/
mv ui/data-table.* organisms/
mv ui/file-upload.* organisms/
mv ui/rich-text-editor.* organisms/
mv ui/charts.* organisms/
mv ui/form.* organisms/
mv ui/form-validation.* organisms/
mv ui/pagination.* organisms/

# Move existing templates and pages
mv ../layout/* templates/
mv ../pages/* pages/

# Create token directories
mkdir -p tokens/{colors,typography,spacing,animation}

# Create pattern directories
mkdir -p patterns/{composition,behavior,layout}

echo "Reorganization complete!" 
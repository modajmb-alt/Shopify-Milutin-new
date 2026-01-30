#!/bin/bash
# Create collections using Shopify CLI
# Run: chmod +x create-collections.sh && ./create-collections.sh

echo "Creating collections via Shopify GraphQL API..."
echo "Make sure you're authenticated with: shopify auth login"

# You'll need to run these in Shopify Admin GraphQL or use the API
# This script outputs the GraphQL mutations to run

cat << 'EOF'

Run these GraphQL mutations in Shopify Admin → Settings → Apps → Develop apps → GraphiQL

mutation createZeneCollection {
  collectionCreate(input: {
    title: "Žene"
    descriptionHtml: "<p>Otkrijte najnovije trendove za žene.</p>"
    ruleSet: {
      appliedDisjunctively: false
      rules: [{ column: TAG, relation: EQUALS, condition: "žene" }]
    }
  }) {
    collection { id title }
    userErrors { field message }
  }
}

mutation createNovoCollection {
  collectionCreate(input: {
    title: "Novo"
    descriptionHtml: "<p>Najnoviji dodaci u našoj kolekciji.</p>"
    sortOrder: CREATED_DESC
    ruleSet: {
      appliedDisjunctively: false
      rules: [{ column: TAG, relation: EQUALS, condition: "novo" }]
    }
  }) {
    collection { id title }
    userErrors { field message }
  }
}

mutation createSnizenjeCollection {
  collectionCreate(input: {
    title: "Sniženje"
    descriptionHtml: "<p>Specijalne ponude i sniženi artikli.</p>"
    ruleSet: {
      appliedDisjunctively: false
      rules: [{ column: VARIANT_COMPARE_AT_PRICE, relation: GREATER_THAN, condition: "0" }]
    }
  }) {
    collection { id title }
    userErrors { field message }
  }
}

EOF

echo ""
echo "For full automation, use the Matrixify app to import mockup-collections.csv"

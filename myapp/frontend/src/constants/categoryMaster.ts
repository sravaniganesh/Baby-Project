export const CATEGORY_MASTER = {
  WOMEN: {
    label: "Women",
    categories: {
      CLOTHING: {
        label: "Women Clothing",
        products: [
          "Saree",
          "Kurti",
          "Dress",
          "Top",
          "Leggings",
          "Nightwear",
          "Innerwear",
          "Ethnic Set",
          "Dupatta",
          "Blouse",
        ],
        attributes: [
          "Material",
          "Color",
          "Pattern",
          "Occasion",
          "Size",
          "Length",
          "Fit",
          "Sleeve Type",
          "Wash Care",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      BEAUTY: {
        label: "Beauty & Cosmetics",
        products: [
          "Face Wash",
          "Face Cream",
          "Lipstick",
          "Foundation",
          "Compact",
          "Kajal",
          "Mascara",
          "Shampoo",
          "Conditioner",
          "Hair Oil",
        ],
        attributes: [
          "Skin Type",
          "Shade",
          "Net Quantity",
          "Ingredients",
          "Usage",
          "Expiry Date",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      HYGIENE: {
        label: "Women Hygiene",
        products: [
          "Sanitary Pads",
          "Panty Liners",
          "Menstrual Cups",
          "Intimate Wash",
        ],
        attributes: [
          "Pack Size",
          "Material",
          "Usage",
          "Disposal Type",
          "Net Quantity",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      ACCESSORIES: {
        label: "Women Accessories",
        products: [
          "Handbag",
          "Jewellery",
          "Watch",
          "Wallet",
          "Hair Accessories",
        ],
        attributes: [
          "Material",
          "Color",
          "Type",
          "Occasion",
          "Closure Type",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      FOOTWEAR: {
        label: "Women Footwear",
        products: [
          "Flats",
          "Heels",
          "Sandals",
          "Slippers",
          "Shoes",
        ],
        attributes: [
          "Size",
          "Material",
          "Sole Material",
          "Closure Type",
          "Heel Height",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },
    },
  },

  KIDS: {
    label: "Kids & Baby",
    categories: {
      BABY_CARE: {
        label: "Baby Care",
        products: [
          "Baby Diapers",
          "Baby Wipes",
          "Baby Soap",
          "Baby Shampoo",
          "Baby Lotion",
          "Baby Oil",
          "Baby Powder",
          "Baby Food",
          "Baby Milk Powder",
          "Infant Formula",
          "Baby Cereal",
          "Feeding Bottle",
        ],
        attributes: [
          "Age Group",
          "Net Quantity",
          "Ingredients",
          "Usage",
          "Expiry Date",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      CLOTHING: {
        label: "Kids Clothing",
        products: [
          "Baby Dress",
          "Kids T-Shirt",
          "Kids Jeans",
          "Kids Shorts",
          "Kids Nightwear",
          "School Uniform",
        ],
        attributes: [
          "Age Group",
          "Size",
          "Material",
          "Color",
          "Fit",
          "Wash Care",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      TOYS: {
        label: "Toys",
        products: [
          // 🎲 NORMAL PLAYING TOYS
          "Ball",
          "Toy Car",
          "Toy Train",
          "Toy Gun",
          "Doll",

          // 🪵 WOODEN TOYS
          "Wooden Blocks",
          "Wooden Puzzle",
          "Wooden Kitchen Set",

          // 🧸 PLASTIC TOYS
          "Plastic Building Blocks",
          "Plastic Animals",
          "Plastic Vehicles",

          // 📘 EDUCATIONAL TOYS
          "Puzzle",
          "Alphabet Toy",
          "Math Learning Toy",
          "Activity Board",

          // 🔋 ELECTRONIC TOYS
          "Remote Control Toy",
          "Musical Toy",
          "Light & Sound Toy",
        ],
        attributes: [
          "Age Group",
          "Material (Plastic/Wood/Electronic)",
          "Battery Required",
          "Safety Warning",
          "Net Quantity",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      BOOKS: {
        label: "Kids Books",
        products: [
          "Coloring Book",
          "Story Book",
          "Activity Book",
          "Educational Book",
        ],
        attributes: [
          "Language",
          "Age Group",
          "Number of Pages",
          "Author",
          "Binding Type",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      SCHOOL: {
        label: "School Essentials",
        products: [
          "School Bag",
          "Water Bottle",
          "Lunch Box",
          "Geometry Box",
          "Notebook",
        ],
        attributes: [
          "Material",
          "Capacity",
          "Color",
          "Net Quantity",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },

      FOOTWEAR: {
        label: "Kids Footwear",
        products: [
          "Kids Shoes",
          "Kids Sandals",
          "Kids Slippers",
        ],
        attributes: [
          "Size",
          "Material",
          "Closure Type",
          "Weight (grams)", // ✅ mandatory
          "Description",
        ],
      },
    },
  },
};
/* ================= RETURN / REPLACEMENT RULES ================= */

export const POLICY_RULES = {
  CLOTHING: {
    returnable: true,
    replaceable: true,
    exchangeable: true,
  },

  FOOTWEAR: {
    returnable: true,
    replaceable: true,
    exchangeable: true,
  },

  TOYS: {
    returnable: true,
    replaceable: true,
    exchangeable: false,
  },

  BOOKS: {
    returnable: false,
    replaceable: false,
    exchangeable: false,
  },

  BEAUTY: {
    returnable: false,
    replaceable: false,
    exchangeable: false,
  },

  HYGIENE: {
    returnable: false,
    replaceable: false,
    exchangeable: false,
  },

  BABY_CARE: {
    returnable: false,
    replaceable: false,
    exchangeable: false,
  },

  SCHOOL: {
    returnable: false,
    replaceable: false,
    exchangeable: false,
  },
};

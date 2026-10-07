export const store_name = "Your Store";
export const store_url = "intermediate-plan-store.vercel.app";
export const logo = "";
export const default_delivery_price = 500;

export const store_description = `🛍️ Bienvenue chez ${store_name} – Votre boutique en ligne de confiance...`;

export const categories = [
  { name: "Mode & Accessoires", thumbnail: "", icon: "" },
  { name: "High-Tech & Audio", thumbnail: "", icon: "" },
  { name: "Maison & Décoration", thumbnail: "", icon: "" },
  { name: "Sport & Bien-être", thumbnail: "", icon: "" },
  { name: "Beauté & Cosmétiques", thumbnail: "", icon: "" },
  { name: "Bagagerie & Voyage", thumbnail: "", icon: "" }
];

export const contact_info = {
  phone1: "",
  phone2: "",
  email: "",
  socials: [
    { platform: "facebook", name: "", link: "" },
    { platform: "instagram", name: "", link: "" },
    { platform: "tiktok", name: "", link: "" }
  ]
};

export const order_states = [
  { id: 0, label: "En attente", color: "yellow" },
  { id: 1, label: "Confirmée", color: "blue" },
  { id: 2, label: "Expédiée", color: "purple" },
  { id: 3, label: "Livrée", color: "green" }
];

export const wilayas = [
  "Adrar", "Chlef", "Laghouat", "Oum El Bouaghi", "Batna", "Béjaïa", "Biskra",
  "Béchar", "Blida", "Bouira", "Tamanrasset", "Tébessa", "Tlemcen", "Tiaret",
  "Tizi Ouzou", "Alger", "Djelfa", "Jijel", "Sétif", "Saïda", "Skikda",
  "Sidi Bel Abbès", "Annaba", "Guelma", "Constantine", "Médéa", "Mostaganem",
  "M'Sila", "Mascara", "Ouargla", "Oran", "El Bayadh", "Illizi", "Bordj Bou Arreridj",
  "Boumerdès", "El Tarf", "Tindouf", "Tissemsilt", "El Oued", "Khenchela",
  "Souk Ahras", "Tipaza", "Mila", "Aïn Defla", "Naâma", "Aïn Témouchent",
  "Ghardaïa", "Relizane", "Timimoun", "Bordj Badji Mokhtar", "Ouled Djellal",
  "Béni Abbès", "In Salah", "In Guezzam", "Touggourt", "Djanet", "El M'Ghair",
  "El Meniaa"
];

export const admin_email = process.env.ADMIN_EMAIL || "admin@store.dz";

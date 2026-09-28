const express = require("express");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = process.env.PORT || 3000;

const DATA_FILE = path.join(__dirname, "products.json");

const ADMIN_PASSWORD = "122918";

app.use(express.json({ limit: "2mb" }));
app.use(express.static(path.join(__dirname, "public")));


// --------------------------------------------------
// ÜRÜN DOSYASI
// --------------------------------------------------

function getProducts() {

    if (!fs.existsSync(DATA_FILE)) {

        const defaultProducts = [
            {
                id: 1,
                category: "Telefonlar",
                name: "Ürün Adı 1",
                description: "Ürün açıklaması",
                image: "images/urun1.jpg"
            },
            {
                id: 2,
                category: "Telefonlar",
                name: "Ürün Adı 2",
                description: "Ürün açıklaması",
                image: "images/urun2.jpg"
            },
            {
                id: 3,
                category: "Aksesuarlar",
                name: "Aksesuar Adı 1",
                description: "Ürün açıklaması",
                image: "images/aksesuar1.jpg"
            },
            {
                id: 4,
                category: "Aksesuarlar",
                name: "Aksesuar Adı 2",
                description: "Ürün açıklaması",
                image: "images/aksesuar2.jpg"
            }
        ];

        fs.writeFileSync(
            DATA_FILE,
            JSON.stringify(defaultProducts, null, 4),
            "utf8"
        );

        return defaultProducts;
    }

    try {

        return JSON.parse(
            fs.readFileSync(DATA_FILE, "utf8")
        );

    } catch (error) {

        return [];
    }
}


function saveProducts(products) {

    fs.writeFileSync(
        DATA_FILE,
        JSON.stringify(products, null, 4),
        "utf8"
    );
}


// --------------------------------------------------
// ADMIN OTURUMU
// --------------------------------------------------

let adminTokens = new Set();


function checkAdmin(req, res, next) {

    const token = req.headers.authorization;

    if (!token || !adminTokens.has(token)) {

        return res.status(401).json({
            error: "Yetkisiz erişim."
        });

    }

    next();
}


// --------------------------------------------------
// MÜŞTERİ ÜRÜNLERİ
// --------------------------------------------------

app.get("/api/products", (req, res) => {

    const products = getProducts();

    res.json(products);

});


// --------------------------------------------------
// ADMIN GİRİŞ
// --------------------------------------------------

app.post("/api/admin/login", (req, res) => {

    const { password } = req.body;

    if (password !== ADMIN_PASSWORD) {

        return res.status(401).json({
            error: "Şifre yanlış."
        });

    }

    const token = crypto.randomBytes(32).toString("hex");

    adminTokens.add(token);

    res.json({
        success: true,
        token: token
    });

});


// --------------------------------------------------
// ADMIN ÜRÜNLERİ GETİR
// --------------------------------------------------

app.get("/api/admin/products", checkAdmin, (req, res) => {

    res.json(getProducts());

});


// --------------------------------------------------
// ÜRÜN EKLE
// --------------------------------------------------

app.post("/api/admin/products", checkAdmin, (req, res) => {

    const {
        name,
        category,
        description,
        image,
        stockStatus
    } = req.body;


    if (!name || !category) {

        return res.status(400).json({
            error: "Ürün adı ve kategori zorunludur."
        });

    }


    const products = getProducts();


    const newProduct = {

        id: Date.now(),

        name: name,

        category: category,

        description: description || "",

        image: image || "",

        stockStatus: stockStatus

    };


    products.push(newProduct);

    saveProducts(products);


    res.json({
        success: true,
        product: newProduct
    });

});


// --------------------------------------------------
// ÜRÜN GÜNCELLE
// --------------------------------------------------

app.put("/api/admin/products/:id", checkAdmin, (req, res) => {

    const products = getProducts();

    const id = Number(req.params.id);

    const product = products.find(
        item => item.id === id
    );


    if (!product) {

        return res.status(404).json({
            error: "Ürün bulunamadı."
        });

    }


    const {
        name,
        category,
        description,
        image,
        stockStatus: stockStatus 
    } = req.body;


    product.name = name || "";

    product.category = category || "Diğer";

    product.description = description || "";

    product.image = image || "";

    product.stockStatus = stockStatus;

    saveProducts(products);


    res.json({
        success: true,
        product: product
    });

});


// --------------------------------------------------
// ÜRÜN SİL
// --------------------------------------------------

app.delete("/api/admin/products/:id", checkAdmin, (req, res) => {

    let products = getProducts();

    const id = Number(req.params.id);


    const oldLength = products.length;


    products = products.filter(
        item => item.id !== id
    );


    if (products.length === oldLength) {

        return res.status(404).json({
            error: "Ürün bulunamadı."
        });

    }


    saveProducts(products);


    res.json({
        success: true
    });

});


// --------------------------------------------------
// SUNUCU
// --------------------------------------------------

app.listen(PORT, "0.0.0.0", () => {

    console.log("Prime-Tech sunucusu çalışıyor.");

    console.log(
        `http://localhost:${PORT}`
    );

    console.log(
        "Admin: http://localhost:3000/admin.html"
    );

});
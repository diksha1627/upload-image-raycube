import express from "express";
import mongoose from "mongoose";
import multer from "multer";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

// Setup __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());



// Connect to MongoDB
mongoose
  .connect("mongodb+srv://diksha:Alpha113.@cluster0.zpie1go.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Schema
const fileSchema = new mongoose.Schema({
  filename: String,
  originalName: String,
  path: String,
  createdAt: { type: Date, default: Date.now },
});

const File = mongoose.model("File", fileSchema);

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      const uploadPath = path.join(__dirname, "uploads/");
      fs.mkdirSync(uploadPath, { recursive: true }); // ensure folder exists
      cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
      const uniqueName = Date.now() + "-" + file.originalname;
      cb(null, uniqueName);
    },
  });

const upload = multer({ storage });

// Upload endpoint
app.post("/upload", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No file uploaded" });
    }

    const fileDoc = new File({
      filename: req.file.filename,
      originalName: req.file.originalname,
      path: req.file.path,
    });

    await fileDoc.save();

    const downloadUrl = `${req.protocol}://${req.get("host")}/download/${fileDoc._id}`;

    res.json({ downloadUrl });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Download endpoint
app.get("/download/:id", async (req, res) => {
  try {
    const fileDoc = await File.findById(req.params.id);
    if (!fileDoc) return res.status(404).json({ error: "File not found" });

    res.download(fileDoc.path, fileDoc.originalName); // triggers direct download
  } catch (err) {
    console.error("Download error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});

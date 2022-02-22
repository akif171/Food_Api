import { Product } from "../models";
import multer from "multer";
import path from "path";
import Joi from "joi";
import fs from "fs";
import CustomErrorHandler from "../services/CustomErrorHandler";
import productSchema from "../validators/productValidator";

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;

    cb(null, uniqueName);
  },
});

const handleMultiPartData = multer({
  storage,
  limits: { fileSize: 1000000 * 5 },
}).single("image");

const productController = {
  async store(req, res, next) {
    //multipart form data
    handleMultiPartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }
      console.log(err);

      const filePath = req.file.path;

      //validation

      const { error } = productSchema.validate(req.body);

      if (error) {
        //Delete the uploaded file

        fs.unlink(`${appRoot}/${filePath}`, (err) => {
          if (err) {
            return next(CustomErrorHandler.serverError(err.message));
          }
        });
        console.log(error);
        return next(error);
      }

      const { name, price, size } = req.body;

      let document;

      try {
        document = await Product.create({
          name,
          price,
          size,
          image: filePath,
        });
      } catch (error) {
        console.log(error);
        return next(error);
      }

      res.json(document);
    });
  },
  update(req, res, next) {
    handleMultiPartData(req, res, async (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError(err.message));
      }
      console.log(err);

      let filePath;
      if (req.file) {
        filePath = req.file.path;
      }

      //validation

      const { error } = productSchema.validate(req.body);

      if (error) {
        //Delete the uploaded file

        if (req.file) {
          fs.unlink(`${appRoot}/${filePath}`, (err) => {
            if (err) {
              return next(CustomErrorHandler.serverError(err.message));
            }
          });
        }
        console.log(error);
        return next(error);
      }

      const { name, price, size } = req.body;

      let document;

      try {
        document = await Product.findOneAndUpdate(
          { _id: req.params.id },
          {
            name,
            price,
            size,
            ...(req.file && { image: filePath }),
          },
          {
            new: true,
          }
        );
      } catch (error) {
        console.log(error);
        return next(error);
      }

      console.log(req.body.id);
      res.json(document);
    });
  },
  async delete(req, res, next) {
    const document = await Product.findByIdAndRemove({ _id: req.params.id });

    if (!document) {
      return next(new Error("Nothing to delete"));
    }

    //image delete
    const imagePath = document._doc.image;
    fs.unlink(`${appRoot}/${imagePath}`, (err) => {
      if (err) {
        return next(CustomErrorHandler.serverError());
      }
    });

    res.json(document);
  },
  async index(req, res, next) {
    let document;
    try {
      //pagination (mongoose pagination)

      document = await Product.find()
        .select("-updatedAt -__v")
        .sort({ createdAt: -1 });
    } catch (error) {
      console.log(error);
      return next(CustomErrorHandler.serverError());
    }
    res.json(document);
  },

  async show(req, res, next) {
    let document;
    try {
      document = await Product.findOne({ _id: req.params.id }).select(
        "-updatedAt -__v"
      );
    } catch (error) {
      console.log(error);
      return next(CustomErrorHandler.serverError());
    }

    return res.json(document);
  },
};

export default productController;

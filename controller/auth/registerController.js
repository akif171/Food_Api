import Joi from "joi";
import CustomErrorHandler from "../../services/CustomErrorHandler";
import { RefreshToken, User } from "../../models";
import bcrypt from "bcrypt";
import JwtService from "../../services/JwtService";
import { REFRESH_SECRET } from "../../config";

const registerController = {
  async register(req, res, next) {
    //request validation

    //User Registeration Schema
    const registerSchema = Joi.object({
      name: Joi.string().min(3).max(30).required(),
      email: Joi.string().email().required(),
      password: Joi.string()
        .pattern(new RegExp("^[a-zA-Z0-9]{3,30}$"))
        .required(),
      confirm_password: Joi.ref("password"),
    });

    console.log(req.body);
    const { error } = registerSchema.validate(req.body);

    //Error Handling
    if (error) {
      return next(error);
    }

    //Check User in Database
    try {
      const exist = await User.exists({ email: req.body.email });
      if (exist) {
        return next(
          CustomErrorHandler.alreadyExist("This is email already taken.")
        );
      }
    } catch (error) {
      console.log(error);
      return next(error);
    }

    const { name, email, password } = req.body;

    //Password Hashing
    const hashedPassword = await bcrypt.hash(password, 10);

    //Prepare the Model

    const user = new User({
      name,
      email,
      password: hashedPassword,
    });

    let access_token;
    let refresh_token;
    try {
      const result = await user.save();
      console.log(result);
      //Token
      access_token = JwtService.sign({ _id: result._id, role: result.role });
      refresh_token = JwtService.sign(
        { _id: result._id, role: result.role },
        "1y",
        REFRESH_SECRET
      );

      //database whitelist
      await RefreshToken.create({ token: refresh_token });
      
    } catch (error) {
      console.log(error);
      return next(error);
    }

    //Main Response
    res.json({ access_token, refresh_token });
  },
};

export default registerController;

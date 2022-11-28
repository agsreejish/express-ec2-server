const dotenv = require('dotenv');
dotenv.config();
const { MYSQL_DATABASE,MYSQL_USERNAME,MYSQL_PASSWORD, BASE_URL } = process.env;
const { user } = require('../models/userModal');
const { ENCRIPTION_PASSCODE } = require('../lib/defaultValues');

const password = require("node-php-password");
const moment = require('moment');
const Sequelize = require('sequelize');
const Op = Sequelize.Op;


const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD, {
	dialect: 'mariadb',
	dialectOptions: { connectTimeout: 1000 } // mariadb connector option
})

const { uuid } = require('uuidv4');
const uniqueRandom = require('unique-random');

// It reads all the items present in database
const getAllUsers = async (req, reply) => {
	try {
		const users = await user.findAll();
		return users
	}
	catch (err) { console.log(err) }
}

const isUserNameExists = async (req, reply) => {
	try {
		const is_username_exist = await user.findOne({ where: { username: req.body.username, status: { [Op.ne]: 2 } } });
			if (is_username_exist) {
			reply.send({ status: 0, message: "Your username is already in our system. Please try to login to your account" });
		} else {
			reply.send({ status: 1, message: "Not found" });
		}

	}
	catch {

	}
}

// It adds an item to database
const addItem = async (req, reply) => {
	try {
		const files = req.files;
		const body = req.body;
		console.log(body,"body")
		const profile_pics = [
			{ name: 'profile_pic1', value: 1 },
			{ name: 'profile_pic2', value: 2 },
			{ name: 'profile_pic3', value: 3 },
			{ name: 'profile_pic4', value: 4 },
			{ name: 'profile_pic5', value: 5 }
		];

		var NewItem = user.build({ ...body });
		var random = uniqueRandom(101015, 999999);
		NewItem.password = random();
		NewItem.activation_code = random();
		NewItem.email_verification_token = uuid();
		NewItem.profile_pic = "avatar.jpg";

		if (files) {
			if (typeof files[body.profile_pic_field] != 'undefined') {
				NewItem.profile_pic = files[body.profile_pic_field][0].filename;
			}
		}

		if (typeof body.working_hours != 'undefined') {
			var working_hours = JSON.parse(body.working_hours);
			for (let working_hour of working_hours) {
				NewItem['working_' + working_hour.key] = working_hour.open ? 'O' : 'C';
			}
		}

		if (typeof body.password != 'undefined') {
			NewItem['password'] = password.hash(body.password);
		}

		if (body.years_in_industry == '') {
			NewItem.years_in_industry = 0;
		}
		var random = uniqueRandom(1010, 9999);
		let profile_id = random();
		let is_profile_id = true;
		while(is_profile_id){
			is_profile_id = await user.findOne({ where: { profile_id: profile_id , status: { [Op.ne]: 2 } } });
			if(is_profile_id){
				profile_id = random();			
			}
		}
		NewItem.profile_id =  "L100"+profile_id.toString()

		NewItem.timestamp = moment().unix();
		if (typeof body.status != 'undefined') {
			NewItem.status = body.status;
		} else {
			NewItem.status = 0;
		}
		const is_username_exist = await user.findOne({ where: { username: body.username,   status: { [Op.ne]: 2 } } });
		const is_email_exist = await user.findOne({ where: { email_id: body.email_id,   status: { [Op.ne]: 2 } } });

		if (is_username_exist) {
			reply.send({ status: 0, message: "Your username is already in our system. Please try to login to your account" });
		} else if (is_email_exist){
			reply.send({ status: 0, message: "Your email is already in our system. Please try to login to your account" });
		}
		else {
			var user_data = await NewItem.save().then(item => {
				if (typeof item.dataValues != 'undefined') {
					return item.dataValues;
				} else {
					return null;
				}
			});
			if (typeof user_data.id != 'undefined') {
				
				if (files) {
					for (let profile_pic of profile_pics) {
						if (typeof files[profile_pic.name] != 'undefined') {
							let profile_pic_item = {};
							profile_pic_item.user_id = user_data.id;
							profile_pic_item.filename = files[profile_pic.name][0].filename;
							profile_pic_item.img_type = profile_pic.value;
							profile_pic_item.timestamp = moment().unix();
							profile_pic_item.status = 1;
							let profilePicItem = profileImage.build({ ...profile_pic_item });
							await profilePicItem.save().then(item => {
								if (typeof item.dataValues != 'undefined') {
									return item.dataValues;
								} else {
									return null;
								}
							});
						}
					}
				}

				reply.send({ status: 1, user: user_data, message: 'Your information is submitted successfully. Profile registration is in progress. Once registration is completed, you will receive an email with link where you can view and edit details.' });
			} else {
				reply.send({ status: 0, message: 'Failed to submit your information. Please try after sometime.' });
			}
		}
	}
	catch (err) { console.log(err) }
}

// It updates the item present in database
const updateItem = async (req, reply) => {
	try {
		const { id } = req.params;
		const item = req.body;

		var user_data = await user.findOne({ where: { id: id } });

		if (typeof item.password != "undefined" && item.password != "" && item.password != null) {
			item.password = password.hash(item.password);
		} else {
			delete item.password;
		}

		const updatedItem = await user.update(
			item,
			{ where: { id: id } }
		).then(function (rowsUpdated) {
			return rowsUpdated[0];
		})


		if (!updatedItem) {
			reply.send({ status: 0, message: 'Failed to update profile' });
		} else {
			var send_data = await user.findOne({ where: { id: id } });
			send_data = JSON.parse(JSON.stringify(send_data));
			send_data.profile_pic_url = BASE_URL + "uploads/users/" + send_data.profile_pic;

			delete send_data.username;
			delete send_data.password;
			reply.send({ status: 1, message: 'Profile has been updated successfully', data: send_data });
		}


	}
	catch (err) { console.log(err) }
}

// It verify the item present in database
const loginAuth = async (req, reply) => {
	try {
		const data = req.body;
		var user_data = await user.findOne({ where: { username: data.username, status: { [Op.or]: [0, 1] } } });
		var email_data = await user.findOne({ where: { email_id: data.username, status: { [Op.or]: [0, 1] } } });
		if (user_data ) {
			if (user_data.status === 0 ) {
				reply.send({ status: 0, message: "Please verify your email to activate login" });
			} else if (password.verify(data.password, user_data.password) ) {
				var send_data = JSON.parse(JSON.stringify(user_data));
				delete send_data.username;
				delete send_data.password;
				delete send_data._id;
				var role_data = await userRole.findOne({ where: { id: send_data.user_type } });
				if (role_data) {
					send_data.role = role_data.name;
				}

				send_data.token = sign({ name: send_data.name, exp: moment().unix() + 108000, iat: moment().unix() }, ENCRIPTION_PASSCODE);
				send_data.profile_pic_url = BASE_URL + "uploads/users/" + send_data.profile_pic;
				reply.send({ status: 1, user_data: send_data, message: "Login successfully" });
			} else {
				reply.send({ status: 0, message: "Incorrect Password" });
			}
		} 
		else if (email_data) {
			if ( email_data.status ===0) {
				reply.send({ status: 0, message: "Please verify your email to activate login" });
			} else if (password.verify(data.password, email_data.password)) {
				var send_data = JSON.parse(JSON.stringify(email_data));
				delete send_data.username;
				delete send_data.password;
				delete send_data._id;
				var role_data = await userRole.findOne({ where: { id: send_data.user_type } });
				if (role_data) {
					send_data.role = role_data.name;
				}

				send_data.token = sign({ name: send_data.name, exp: moment().unix() + 108000, iat: moment().unix() }, ENCRIPTION_PASSCODE);
				send_data.profile_pic_url = BASE_URL + "uploads/users/" + send_data.profile_pic;
				reply.send({ status: 1, user_data: send_data, message: "Login successfully" });
			} else {
				reply.send({ status: 0, message: "Incorrect Password" });
			}
		} 
		else {
			reply.send({ status: 0, message: "No such account exist. Please check the username" });
		}
	}
	catch (err) { console.log(err) }
}

module.exports = {
	addUser, updateUser, fetchUserById, isUserNameExists, 
	getAllUsers, loginAuth, forgotPassword, resetPassword
};

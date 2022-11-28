const dotenv = require('dotenv');
dotenv.config();
const Sequelize = require('sequelize');
const { MYSQL_DATABASE,MYSQL_USERNAME,MYSQL_PASSWORD } = process.env;

const sequelize = new Sequelize(MYSQL_DATABASE, MYSQL_USERNAME, MYSQL_PASSWORD, {
  dialect: 'mariadb',
  dialectOptions: {connectTimeout: 1000} // mariadb connector option
})

const user = sequelize.define('user', {  
	username: { type: Sequelize.STRING, allowNull: false },
	password: { type: Sequelize.STRING },
	userType: { type: Sequelize.INTEGER },
	firstName: { type: Sequelize.STRING, allowNull: false },
	lastName: { type: Sequelize.STRING, allowNull: false },
	phone: { type: Sequelize.STRING},
	email: { type: Sequelize.STRING, allowNull: false },
	profilePic: { type: Sequelize.TEXT },
	timestamp: { type: Sequelize.INTEGER, allowNull: false },
	emailVerificationToken: { type: Sequelize.STRING },
	phoneVerificationOtp: { type: Sequelize.STRING },
	resetCode: { type: Sequelize.STRING },
	resetStatus: { type: Sequelize.TINYINT(4) },
	notiCount: { type: Sequelize.TINYINT(5) },
	active: { type: Sequelize.STRING },
	status: { type: Sequelize.TINYINT(2) }
}, {
  timestamps: false 
});

module.exports = { user };

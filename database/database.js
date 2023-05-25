const Sequelize = require('sequelize');

const conexao = new Sequelize('ingles_movies_br_o56l','root','1e3LV6zk2LNB8Rh3kDocakJbDJJ49hBd',{
	host:'dpg-chnru22k728jv5dd92r0-a',
	dialect:'postgres'
})

module.exports = conexao;
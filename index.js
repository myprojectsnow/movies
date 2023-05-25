const express = require('express');
const session = require('express-session');

const body = require('body-parser');

const app = express();

const http = require('http');

const cors = require('cors');

app.use(express.static(__dirname+'/public'));

app.set('view engine','ejs');

app.use(body.urlencoded({ extended: false }));

app.use(body.json());

const Sequelize = require('sequelize');

const connectar = require('./database/database');

var sessionstorage = require('sessionstorage');

const fs = require('fs');

const bcrypt = require('bcryptjs');

const _pix = require('faz-um-pix');

app.set('trust proxy', 1);
app.use(session({
cookie:{
    secure: true,
    maxAge:60000
       },
secret: 'secret',
saveUninitialized: true,
resave: false
}));


app.use(cors());

const translate = require('@iamtraction/google-translate');

app.listen(3000,()=>{

try{
console.log('Servidor iniciado com sucesso');
}catch{
console.log('Error de servidor');
}

});


connectar.authenticate().then(()=>{
	console.log('connectado com sucesso');
}).catch((error)=>{
	console.log('error ao connectar a base de dados'+error);
});


const tabela = connectar.define('palavras',{
  id:{ type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  nome:{type:Sequelize.STRING},
  ingles:{type:Sequelize.STRING},
  traducao:{type:Sequelize.STRING},
})


const compradores = connectar.define('usuarios_compradores',{
  id:{ type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  nome:{type:Sequelize.STRING},
  email:{type:Sequelize.STRING},
  token: {type: Sequelize.STRING}
});

//tabela.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});

//compradores.sync({force:true}).then('tabela criada com sucesso').catch((error)=>{console.log('error ao criar a tabela'+error)});

app.get('/',(req,res)=>{

res.render('index');

});


app.post('/traducao',(req,res)=>{


const traducao = req.body.palavras;

const movie = req.body.movie;

console.log(traducao);

console.log(movie);

if (traducao == '' || movie == ''){

console.log('Não tem um token');

}else{


translate(traducao, { from: 'en', to: 'pt' }).then(res => {
  console.log(res.text); // OUTPUT: ''
  /*console.log(res.from.autoCorrected); // OUTPUT: false
  console.log(res.from.text.value); // OUTPUT: [Thank] you
  console.log(res.from.text.didYouMean); // OUTPUT: true*/

tabela.create({

nome:movie,
ingles:traducao,
traducao:res.text

});    
    
}).catch(err => {
    console.log(err);
});

res.redirect('/traducao');

}


});


// aqui são os download das legendas em ingles para cada id lá no href do html ele vai pega uma legenda especifica ok
// mas é claro lá no html vai esta o nome do filme 

app.get('/download/:id',(req,res)=>{

res.download(__dirname+`/public/legendas/legendas.zip`);

});


app.get('/traducao',(req,res)=>{

tabela.findAll().then(ingles=>{

res.render('translate',{traducao:ingles});

});

});


app.post('/criar-anki',(req,res)=>{

let nome = req.body.baralho;

req.session.nome = nome;

let identificar = req.body.nome;

req.session.identificar = identificar;

res.redirect('/traducao');

});


app.get('/gerar-anki',(req,res)=>{


tabela.findAll({raw:true,where:{nome:req.session.identificar}}).then(palavra=>{

palavra.forEach(palavras=>{

//console.log(palavras.ingles);
//console.log(palavras.traducao);

const quebra_linha = '\r';

const data = `${palavras.ingles}${quebra_linha}${palavras.traducao}${quebra_linha}${quebra_linha}`;

fs.appendFile(`${req.session.nome}.txt`, data,function(err){
   console.log('Error ao grava palavras'.err);
}); 

});

});

res.redirect('/traducao');

});


app.post('/verificar',(req,res)=>{

let nome = req.body.verificar;

req.session.nome = nome;

res.redirect('/traducao');

});


app.get('/anki/:id',(req,res)=>{

res.download(`${req.session.nome}.txt`);

});



app.post('/comprar',(req,res)=>{

let nome = req.body.nome;
let email = req.body.email;

const password = email;

const salt = bcrypt.genSaltSync(10);
const hash = bcrypt.hashSync(password, salt);

compradores.create({

nome:nome,
email:email,
token:hash

});

const code = _pix.Pix("lipe.tr@hotmail.com", "felipe de jesus brasilio da costa", "sp", "100", "Compra do metodo english movies br");

code.then(result=>{

res.render('payment',{payments:result});

});

});


app.post('/your-token',(req,res)=>{


let token = req.body.token;

compradores.findAll({where:{token:token}}).then(result=>{

if (result == ''){

console.log('Erro coloque seu token ou seu token este incorreto.');

}else{

res.render('pro',{results:result});

}

});

});


app.get('/download-video',(req,res)=>{


res.download(__dirname+`/public/software/software.zip`);


});


app.get('/gerencia',(req,res)=>{


compradores.findAll({raw:true}).then(pessoas=>{

res.render('registros',{identificar:pessoas});

});

});

app.get('/manutencao',(req,res)=>{

tabela.destroy({ truncate : true, cascade: false });

res.redirect('/gerencia');

});



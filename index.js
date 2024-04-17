const bcrypt = require('bcrypt')
const multer = require('multer');
require('dotenv').config()
const express = require('express');
const app = express();
const port = process.env.PORT
const mongoose = require('mongoose');
const File = require('./models/File');

app.use(express.urlencoded({ extended: true }))

mongoose.connect(process.env.URL).
then(res => console.log('connected to mongodb')).
catch(err => console.log(err))


const upload = multer({dest: 'uploads'})

app.set('view engine', 'ejs')

app.get('/', (req, res) =>{
    res.render('index')
})

app.post('/upload', upload.single('file') , async (req, res) =>{
    console.log(req.file, '\n')

    const fileData = {
        path: req.file.path,
        originalName: req.file.originalname
    }

    if(req.body.password != null && req.body.password !== ""){
        fileData.password = await bcrypt.hash(req.body.password, 10)
    }

    const file = await File.create(fileData)
    // console.log(file)
    res.render('index',{ fileLink : `${req.headers.origin}/file/${file.id}`})
})

const handleDownload = async (req, res)=>{
    const file = await File.findById(req.params.id)

    if(file.password != null){
        if (req.body.password == null){
            res.render('password')
            return
        }
        if (!await bcrypt.compare(req.body.password, file.password))
        {
            res.render('password', {error: 'password incorrect'})
        }
    }

    file.downloadCount++
    await file.save()

    res.download(file.path, file.originalName)
}

app.route('/file/:id').get(handleDownload).post(handleDownload)


app.listen(port, ()=>{
    console.log('listening on port '+ port)
});


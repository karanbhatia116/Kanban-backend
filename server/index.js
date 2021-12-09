const app = require('express')();
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

dotenv.config();
const mongoDBURI = process.env.DB_URI;
const PORT = process.env.PORT || 5000;



app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

mongoose.connect(mongoDBURI, { useNewUrlParser: true, useUnifiedTopology: true });
const mongodb = mongoose.connection;
mongodb.on('connected', () => console.log('MongoDB connected!'));


const Schema = mongoose.Schema;
var taskListSchema = new Schema({
    name: String,
    items: Array,
    parent_id: String
});
var List = mongoose.model('lists', taskListSchema);
var userSchema = new Schema({
    username: String,
    password: String,
    full_name: String,
    bio: String,
    title: String,
    email: String,
});

var User = mongoose.model('users', userSchema);

var boardSchema = new Schema({
    title: String, 
    id: String,
});

var Board = mongoose.model('boards', boardSchema);


app.get('/boards', (req, res) =>{
    console.log('get boards');
    Board.find({}, (err, boards) => {
        if(err)
            res.send(err);
        res.json(boards);
    });
});
app.post('/addboard', (req, res) => {
    const newBoard = new Board({
        title: req.body.title,
        id: req.body.id
    });
    newBoard.save((err, board) => {
        if(err)
            res.send(err);
        res.json(board);
    });
})

app.delete('/deleteboard', (req, res)=>{
    Board.findOneAndDelete({id: req.body.id}, (err, board) => {
        if(err)
            res.send(err);
        else
        {
            List.deleteMany({parent_id: req.body.id}, (err, lists) => {
                if(err)
                    res.send(err);
                else
                {
                    res.json(board);
                }
            });
        }
    });
})

app.put('/updateboard', (req, res) => {
    Board.findOneAndUpdate({id: req.body.id}, {title: req.body.title}, (err, board) => {
        if(err)
            res.send(err);
        res.json(board);
    });
});
app.get('/lists/:id', (req, res) => {
    const parent_id = req.params.id;
    List.find({parent_id: parent_id}, (err, docs) => {
        if (err) res.send({ success: false, err: "Internal Server error" });
        else {
            res.send({ success: true, data: docs });
        }
    });
});
app.post('/updatelists/:id', async (req, res) => {
    const lists = req.body;
    let error = false;
    for (var key in lists) {
        if (lists.hasOwnProperty(key)) {
            const result = await List.findByIdAndUpdate(lists[key]._id, lists[key]);
            if(result.length === 0)
            {
                error = true;
            }
        }
    }
    if(error)
    {
        res.send({success: false, err: "Internal Server error"});
    }
    else
    {
        res.send({success: true, data: "Updated"});
    }
});

app.post('/addlist/:id', async (req, res) => {
    const parent_id = req.params.id;
    var column = new List({
        name: '',
        items: [],
        parent_id: parent_id
    });
    column.save().then(() => {
        res.send({
            success: true,
            message: 'List added successfully',
            column_id: column._id
        })
    }).catch(err => console.log(err));
});

app.post('/deletelist', async (req, res) => {
    List.findByIdAndDelete(req.body.column_id, (err) => {
        if (err)
            res.sendStatus(500);
        else
            res.sendStatus(200);
    });
});


app.post('/login', (req, res) => {
    const userName = req.body.user;
    const password = req.body.pwd;
    User.findOne({username: userName, password: password}, (err, user) => {
        if (err) res.send({success: false, err: "Internal Server error"});
        else if (!user) {
            res.send({success: false, err: "Invalid username or password"});
        } else {
            res.send({success: true, user: user});
        }
    }
    );
});

app.post('/update_password', (req, res) =>{
    User.findOne({username: req.body.user}, (err, user) => {
        if (err) res.send({success: false, err: "Internal Server error"});
        else if (!user) {
            res.send({success: false, err: "Invalid username or password"});
        } else {
            user.password = req.body.pwd;
            user.save().then(() => {
                res.send({success: true});
            }).catch(err => console.log(err));
        }
    }
    );
});

app.post('/update_user', (req, res) => {
    User.findOne({username: req.body.user}, (err, user) => {
        if (err) res.send({success: false, err: "Internal Server error"});
        else if (!user) {
            res.send({success: false, err: "Invalid username or password"});
        } else {
            user.full_name = req.body.full_name;
            user.bio = req.body.bio;
            user.email = req.body.email;
            user.title = req.body.title;
            user.password = req.body.pwd;
            user.save().then(() => {
                res.send({success: true, user: user});
            }).catch(err => console.log(err));
        }
    }
    );
});

app.post('/signup', (req, res) =>{

        //check if user already exists
        User.findOne({username: req.body.user}, (err, user) => {
            if (err) res.send({success: false, err: "Internal Server error"});
            else if (user) {
                res.send({success: false, err: "User already exists"});
            } else {

            var user = new User({
                username: req.body.user,
                password: req.body.pwd,
                full_name: "",
                bio: "",
                title: "",
                email: ""
            });
            user.save().then(() => {
                res.send({success: true});
            }).catch(err => res.send({success: false, err: err}));
        }
    });
});
app.listen(PORT, ()=> console.log('Server started on port 5000'));
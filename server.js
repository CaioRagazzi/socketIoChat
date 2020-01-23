const mongo = require('mongodb').MongoClient;
const client = require('socket.io').listen(4000).sockets;

// connect to mongo

mongo.connect('mongodb://127.0.0.1:27017', function (err, dataBase) {
    if (err) {
        throw err
    }

    console.log('MongoDB connected...');
    var db = dataBase.db('mongochat')

    // connect to socket.io

    client.on('connection', function (socket) {
        let chat = db.collection('chats');

        //create funcion to send status
        sendStatus = function (s) {
            socket.emit('status', s);
        }

        //Get chats from mongo collection
        chat.find().limit(100).sort({ _id: 1 }).toArray(function (err, res) {
            if (err) {
                throw err
            }

            // Emit the messages
            socket.emit('output', res);
        });

        socket.on('input', function (data) {
            
            let name = data.name;
            let message = data.message;

            //check for name and message

            if (name == '' || message == '') {
                //Send error status

                sendStatus('Please enter a name and message')
            } else {
                // insert message db
                chat.insert({ name: name, message: message }, function () {
                    client.emit('output', [data]);

                    sendStatus({
                        message: 'Message sent',
                        clear: true
                    })
                })
            }
        })

        //Handle clear

        socket.on('clear', function(data) {
            //Remove all chats from the collection
            chat.remove({}, function() {
                socket.emit('clear');
            })
        })
    })
});
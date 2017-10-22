const models = require('../models');
let loggedIn;

module.exports = function (app) {
    //Get an owner by id
    app.get('/owners/:id', function (req, res) {
        if(req.isAuthenticated()) {
            models.Owners.findOne({
                where: {
                    id: req.params.id
                },
                include: [models.Pets]
            }).then(data => {
                models.Posts.findAll({
                    where: { 
                        OwnerId: req.params.id
                    },
                    order: [['createdAt', 'DESC']]
                }).then(posts => {
                    let Posts = [];
                    for(post in posts) {
                        Posts.push(posts[post].dataValues);
                    }
                    res.render('owner', {
                        name: data.name,
                        picture: data.picture,
                        age: data.age,
                        location: data.location,
                        email: data.email,
                        pets: data.Pets,
                        bio: data.bio,
                        posts: Posts,
                        isUser: req.isAuthenticated()
                    });
                });
            });
        }else{
            res.redirect('/');
        }
    });

    //Get all owners
    app.get('/owners', function (req, res) {
        if(req.isAuthenticated()) {
            models.Owners.findAll({}).then(data => {
                let Owners = [];

                for (owner in data) {
                    Owners.push(data[owner]);
                }

                res.render('owners', {
                    owners: Owners,
                    isUser: req.isAuthenticated()
                });
            });
        }else{
            res.redirect('/');
        }
    });

    app.get('/pets/:id', function (req, res) {
        if(req.isAuthenticated()) {
            models.Pets.findOne({
                where: {
                    id: req.params.id
                },
                include: [models.Owners]
            }).then(data => {
                models.Owners.findOne({
                    where: {
                        id: data.OwnerId
                    }
                }).then(ownerData => {
                    models.Friendships.findAll({
                        attributes: ['friendPetId'],
                        where: {
                            myPetId: req.params.id
                        },
                        include: ['friendPet']
                    }).then(petsFriendsData => {
                        console.log(ownerData.name);

                        let Pets = [];

                        for (pet in petsFriendsData) {
                            console.log(petsFriendsData[pet].friendPet.name);
                            console.log("============================");
                            Pets.push(petsFriendsData[pet].friendPet);
                        }

                        res.render('pet', {
                            id: req.params.id,
                            name: data.name,
                            picture: data.picture,
                            age: data.age,
                            type: data.type,
                            breed: data.breed,
                            bio: data.bio,
                            location: ownerData.location,
                            ownerName: ownerData.name,
                            ownerAge: ownerData.age,
                            ownerPicture: ownerData.picture,
                            ownerId: ownerData.id,
                            isUser: req.isAuthenticated(),
                            userId: req.user.id,
                            friendPets: Pets
                        });
                    });
                });
            });
        }else{
            res.redirect('/');
        }
    });

    app.post('/pets/:id', function (req, res) {

        models.Pets.findOne({
            where: {
                id: req.params.id
            },
            include: [models.Owners]
        }).then(data => {
            models.Owners.findOne({
                where: {
                    id: data.OwnerId
                }
            }).then(ownerData => {

                res.render('pet', {
                    id: req.params.id,
                    name: data.name,
                    picture: data.picture,
                    age: data.age,
                    type: data.type,
                    breed: data.breed,
                    bio: data.bio,
                    location: ownerData.location,
                    ownerName: ownerData.name,
                    ownerAge: ownerData.age,
                    ownerPicture: ownerData.picture,
                    ownerId: ownerData.id,
                    friendPetId: req.body.friendPetId,
                    isUser: req.isAuthenticated()
                });

            });
        });
    });

    //Get all pets
    app.get('/pets', function (req, res) {
        if(req.isAuthenticated()) {
            models.Pets.findAll({
                where: {
                    OwnerId: {$ne: req.user.id}
                }
            }).then(data => {
                let Pets = [];
                let Types = [];
                let Breeds = [];

                for (pet in data) {
                    Pets.push(data[pet]);

                    if (!Types.includes(data[pet].type)) {
                        Types.push(data[pet].type);
                    }

                    if (!Breeds.includes(data[pet].breed)) {
                        if (data[pet].breed !== '') {
                            Breeds.push(data[pet].breed);
                        }
                    }
                }

                res.render('pets', {
                    pets: Pets,
                    types: Types,
                    breeds: Breeds,
                    isUser: req.isAuthenticated()
                });
            });
        }else{
            res.redirect('/');
        }
    });

    app.post('/pets', function (req, res) {
        console.log('\n======\n' + req.body.type + '\n======\n' + req.body.breed + '\n======\n' + req.body.age + '\n======\n' + req.body.gender);

        let query = {};

        var age = 0;

        if (req.body.type != '') {
            query.type = req.body.type
        }

        if (req.body.breed != '') {
            query.breed = req.body.breed
        }

        if (req.body.age != '') {
            query.age = req.body.age

            if (req.body.age === '0-3') {
                query.age = {
                    lte: 3
                }
            } else if (req.body.age === '4-7') {
                query.age = {
                    between: [4, 7]
                }
            } else {
                query.age = {
                    gte: 8
                }
            }
        }

        if (req.body.gender != '') {
            query.gender = req.body.gender

        }

        models.Pets.findAll({
            where: query
        }).then(data => {
            let Pets = [];
            let Types = [];
            let Breeds = [];

            for (pet in data) {
                Pets.push(data[pet]);

                if (!Types.includes(data[pet].type)) {
                    Types.push(data[pet].type);
                }

                if (!Breeds.includes(data[pet].breed)) {
                    if (data[pet].breed !== '') {
                        Breeds.push(data[pet].breed);
                    }
                }
            }

            res.render('pets', {
                pets: Pets,
                types: Types,
                breeds: Breeds,
                isUser: req.isAuthenticated()
            })
        })
    });

    //logged in view
    app.get('/home', function (req, res) {
        if (req.isAuthenticated()) {
            models.Owners.findOne({
                where: {
                    id: req.user.id
                }
            }).then(data => {
                models.Posts.findAll({
                    where: {
                        OwnerId: req.user.id
                    },
                    order: [['createdAt', 'DESC']]
                }).then(posts => {
                    let Posts = [];
                    for(post in posts) {
                        Posts.push(posts[post].dataValues);
                    }
                    res.render('home', {
                        ownerPicture: data.picture,
                        ownerName: data.name,
                        posts: Posts,
                        ownerId: req.user.id,
                        isUser: req.isAuthenticated()
                    });
                });
            });
        } else {
            res.redirect('/');
        }
    });

    //Get the current owner pets to choose from for the friendship
    app.post('/myPets', function (req, res) {
        var friendPetId = req.body.friendPetId * 1;
        models.Pets.findAll({
            where: {
                OwnerId: req.user.id * 1
            },
        }).then(data => {

            let Pets = [];

            for (pet in data) {
                Pets.push(data[pet]);
            }

            res.render('pet', {
                friendPetId: friendPetId,
                mypets: Pets,
                isUser: req.isAuthenticated()
            });
        });
    });
}
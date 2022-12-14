const express = require('express');
const homeRoute = express.Router();

homeRoute.route('/')
    .get((req, res) => {
        res.render('Home',
        {
            nav: [
                {link: '/', title: 'Home'},
                {link: '/portfolio', title: 'Portfolio'},
                {link: '/profileAccess', title: 'Profile'}
            ],
            title: 'Home'
        });
        
    })

module.exports = homeRoute;
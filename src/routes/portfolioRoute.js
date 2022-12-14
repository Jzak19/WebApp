const express = require('express');
const portfolioRoute = express.Router();

portfolioRoute.route('/')
    .get((req, res) => {
        res.render('portfolio',
        {
            nav: [
                {link: '/', title: 'Home'},
                {link: '/portfolio', title: 'Portfolio'},
                {link: '/profileAccess', title: 'Profile'}
            ],
            title: 'Portfolio'
        });
        
    })

module.exports = portfolioRoute;
(function() {
    var app = angular.module('store', []);

    app.controller('StoreController', function() {
        this.products = gems;
    });

    app.controller('PanelController', function() {
        this.tab = 3;
        this.selectTab = function(setTab) {
            this.tab = setTab;
        };

        this.isSelected = function(checkTab) {
            return this.tab === checkTab;
        };
    });

    app.controller('ReviewController', function() {
        this.review = {};
        this.addReview = function(product) {
            this.review.createdOn = Date.now();
            product.reviews.push(this.review);
            this.review = {};
        };
    });

    app.controller('SomeController', ['$http', '$log', function($http, $log) {
        var store = this;
        store.products = [];

        $http.get('/products.json')
            .success(function(data) {
                store.products = data;
            });
    }]);

    var gems = [{
        name: 'Dodecahedron',
        price: 2.95,
        description: 'Some gems have hidden qualities beyond their luster, beyond their shine... Dodeca is one of those gems.',
        canPurchase: true,
        soldOut: false,
        image: '../img/gem-01.gif',
        reviews: [{
            stars: 5,
            body: "I love this product",
            author: "joe@tomas.com",
            createdOn: 22
        }, {
            stars: 1,
            body: "This product sucks",
            author: "tim@hater.com",
            createdOn: 2598969966559
        }],
    }, {
        name: 'Pentagonal Gem',
        price: 5.87,
        description: 'Pentagonal goods',
        canPurchase: false,
        soldOut: false,
        image: '../img/gem-02.gif',
        reviews: [],
    }];
})();
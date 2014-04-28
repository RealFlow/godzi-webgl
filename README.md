ReadyMap Building Visualization
===============================

Screenshots
-----------

![checkitout](http://imgur.com/g4rEdQW.jpg)

![checkitout](http://imgur.com/g4Dg02C.jpg)

![checkitout](http://imgur.com/tNayYyj.jpg)

![checkitout](http://imgur.com/qohiosb.jpg)

![checkitout](http://imgur.com/aQ98lSp.jpg)

Data
-----

Buildings data must be declared in JSON format.
```java
[{
    "altura": 15,
    "hoja": "2765",
    "vertices": [{
        "lon": -0.367753,
        "lat": 39.494736
    }, {
        "lon": -0.367794,
        "lat": 39.4947
    }, {
        "lon": -0.367806,
        "lat": 39.494707
    }, {
        "lon": -0.367764,
        "lat": 39.494743
    }]
}, {
    "altura": 15,
    "hoja": "2773",
    "vertices": [{
        "lon": -0.355409,
        "lat": 39.47943
    }, {
        "lon": -0.355333,
        "lat": 39.479374
    }, {
        "lon": -0.35538,
        "lat": 39.479336
    }, {
        "lon": -0.355455,
        "lat": 39.479392
    }]
}
```
where:
"altura" corresponds to building's height.
"hoja" is a building ID.
"vertices" refers to the geographic nodes.
 
License
-------

    ReadyMap SDK
    JavaScript Toolkit for 3D Web Maps
    (c) Copyright 2011 Pelican Mapping
    Repo: http://github.com/gwaldron/godzi-webgl
    Twitter: @pelicanmapping

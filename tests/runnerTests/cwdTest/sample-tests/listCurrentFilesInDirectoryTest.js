var assert = require('../../../../../double-check').assert;

const fs = require('fs');

let dir = process.cwd();
fs.readdir(dir, (err, files) => {
    console.log(files);
    assert.true(files.length == 2, "There should be only two files!")
})
/* global module */
module.exports = function(grunt) {
    grunt.loadNpmTasks('grunt-contrib-qunit');
    grunt.initConfig({
        qunit: {
            all: ['static/js_tests/*/*.html', 'static/js_tests/*.html']
        },
    });
    // A convenient task alias.
    grunt.registerTask('test', ['qunit']);
};

 module.exports = function(grunt) {
 
    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        //uglify 설정
        uglify: {
            options: {
                banner: '/* <%= grunt.template.today("yyyy-mm-dd") %> */ '
            },
            build: {
                src: 'dist/jquery.fallin.js',
                dest: 'dist/jquery.fallin.min.js'
            }
        },
        //jshint
        jshint: {
            all: ['dist/jquery.fallin.js'],
            options:{
                reporter: require('jshint-stylish')
            }
        }
    });
 
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-jshint');
 
    // Default task(s).
    grunt.registerTask('default', ['uglify', 'jshint']); //grunt 명령어로 실행할 작업

};
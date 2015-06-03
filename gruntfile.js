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
                src: 'js/jquery.jk_fallin.js',
                dest: 'js/jquery.jk_fallin.min.js'
            }
        },
        //jshint
        jshint: {
            all: ['js/jquery.jk_fallin.js'],
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
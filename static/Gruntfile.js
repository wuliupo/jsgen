/* jshint node: true */

module.exports = function(grunt) {
  'use strict';

  // Project configuration.
  grunt.initConfig({

    // Metadata.
    pkg: grunt.file.readJSON('../package.json'),
    banner: '/**\n' +
              '* jsGen v<%= pkg.version %> by @zensh\n' +
              '* Copyright <%= grunt.template.today("yyyy") %> <%= pkg.author.email %>\n' +
              '*/\n',
    dist: '../dist',

    // Task configuration.
    clean: {
      dist: [
        'dist/css',
        'dist/fonts',
        'dist/img',
        'dist/js',
        'dist/md',
        'dist/tpl'
      ]
    },

    jshint: {
      options: {
        jshintrc: '.jshintrc'
      },
      gruntfile: {
        src: 'Gruntfile.js'
      },
      src: {
        src: 'src/js/*.js'
      },
      server: {
        src: ['../app.js', '../app.js', '../api/*.js', '../dao/*.js', '../lib/*.js', '../patch/*.js']
      }
    },

    uglify: {
      options: {
        banner: '<%= banner %>'
      },
      reserveLoad: {
        dest: 'dist/js/reserveLoad.min.js',
        src: 'src/bower_components/reserveLoadjs/reserveLoad.js'
      },
      ie: {
        dest: 'dist/js/ie.min.js',
        src: [
          'src/bower_components/es5-shim/es5-shim.js',
          'src/bower_components/json2/json2.js',
          'src/bower_components/html5shiv/dist/html5shiv.js',
          'src/bower_components/respond/respond.src.js'
        ]
      },
      jquery: {
        dest: 'dist/js/jquery.old.js',
        src: ['src/bower_components/jquery.old/jquery.js']
      },
      angular: {
        dest: 'dist/js/angular-all.min.js',
        src: [
          'src/bower_components/angular/angular.js',
          'src/bower_components/angular-animate/angular-animate.js',
          'src/bower_components/angular-cookies/angular-cookies.js',
          'src/bower_components/angular-resource/angular-resource.js',
          'src/bower_components/angular-route/angular-route.js'
        ]
      },
      lib: {
        dest: 'dist/js/lib.min.js',
        src: [
          'src/bower_components/angular-file-upload/angular-file-upload.js',
          'src/bower_components/google-code-prettify/src/prettify.js',
          'src/bower_components/marked/lib/marked.js',
          'src/bower_components/toastr/toastr.js',
          'src/js/lib/angular-locale_zh-cn.js',
          'src/js/lib/angular-ui.js',
          'src/js/lib/bootstrap.js',
          'src/js/lib/hmac-sha256.js',
          'src/js/lib/Markdown.Editor.js',
          'src/js/lib/sanitize.js',
          'src/js/lib/store.js',
          'src/js/lib/utf8.js'
        ]
      },
      jsgen: {
        dest: 'dist/js/<%= pkg.name %>.min.js',
        src: [
          'src/js/locale_zh-cn.js',
          'src/js/router.js',
          'src/js/tools.js',
          'src/js/services.js',
          'src/js/filters.js',
          'src/js/directives.js',
          'src/js/controllers.js',
          'src/js/app.js'
        ]
      }
    },

    recess: {
      dist: {
        options: {
          compile: true,
          compress: true
        },
        dest: 'dist/css/<%= pkg.name %>.min.css',
        src: [
          'src/bower_components/pure/pure.css',
          'src/bower_components/toastr/toastr.css',
          'src/css/prettify.css',
          'src/css/main.css'
        ]
      }
    },

    htmlmin: {
      dist: {
        options: {
          removeComments: true,
          collapseWhitespace: true
        },
        dest: 'dist/tpl/',
        src: ['src/tpl/*.html']
      }
    },

    copy: {
      fonts: {
        expand: true,
        flatten: true,
        dest: 'dist/fonts/',
        src: ['src/bower_components/font-awesome/fonts/*']
      },
      css: {
        expand: true,
        flatten: true,
        dest: 'dist/css/',
        src: ['src/bower_components/font-awesome/css/font-awesome.min.css']
      },
      jquery: {
        expand: true,
        flatten: true,
        dest: 'dist/js/',
        src: ['src/bower_components/jquery/jquery.min.js']
      },
      img: {
        expand: true,
        flatten: true,
        dest: 'dist/img/',
        src: ['src/img/*']
      },
      tpl: {
        expand: true,
        flatten: true,
        dest: 'dist/tpl/',
        src: ['src/tpl/*']
      },
      md: {
        expand: true,
        flatten: true,
        dest: 'dist/md/',
        src: ['src/md/*']
      }
    },

    hash: {
      index: {
        options: {
          algorithm: 'md5',
          urlCwd: 'dist/'
        },
        dest: 'dist/index.html',
        src: 'src/index_src.html'
      }
    }

  });


  // These plugins provide necessary tasks.
  grunt.loadNpmTasks('grunt-contrib-clean');
  // grunt.loadNpmTasks('grunt-contrib-htmlmin');
  // grunt.loadNpmTasks('grunt-contrib-imagemin');
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-hash-url');
  grunt.loadNpmTasks('grunt-recess');

  // Default task.
  grunt.registerTask('default', ['jshint', 'clean', 'uglify', 'recess', 'copy', 'hash']);
};

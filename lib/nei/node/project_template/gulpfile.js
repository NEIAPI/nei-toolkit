/*
 * gulp watch
 * @author {{author}}
 * Auto build by NEI Builder
 */
'use strict';

let path = require('path');
let fs = require('fs');
let gulp = require('gulp');
let mcss = require('mcss');
let livereload = require('gulp-livereload');

gulp.task('watch', () => {
    console.log('live reload starting now...')
    livereload.listen();

    gulp.watch(`public/src/**/*.mcss`, (event) => {
        let instance = mcss({
            filename: event.path
        });
        instance.translate().done((text) => {
            let file = `${path.dirname(event.path)}/${path.basename(event.path, '.mcss')}.css`;
            console.log(`output mcss: ${file}`);
            fs.writeFileSync(file, text);
        }).fail((error) => {
            console.log(`mcss compile failed: ${error}`);
        });
    });
    gulp.watch(['public/**/*.*', 'views/**/*.*'], () => {
        livereload.reload();
    });
});

gulp.start('watch');
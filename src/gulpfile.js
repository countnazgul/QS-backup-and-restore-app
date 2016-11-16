var gulp = require('gulp')
var watch = require('gulp-watch');
var zip = require('gulp-zip');

const extensionPath = 'C:\\Users\\Home\\Documents\\Qlik\\Sense\\Extensions\\QS-backup-and-restore-app'
const filesToMove = [
    '!node_modules/**/*',
    '!.git/**/*',
    '!.vscode/**/*',
    '!build/**/*',
    '!*.zip',
    '!gulpfile.js',
    '!.gitignore',
    '**/*.*'
];

gulp.task('publish', function () {
    return watch(filesToMove, {
        ignoreInitial: false,
        verbose: true,
        name: 'publish'
    })
        .pipe(gulp.dest(extensionPath));
});

gulp.task('zip', function () {
    return gulp.src(extensionPath + '\\**\\*')
        .pipe(zip('QS-backup-and-restore-app.zip'))
        .pipe(gulp.dest('..\\build\\zip'))
});

gulp.task('build', ['zip'], function () {
    gulp.src(filesToMove)
        .pipe(gulp.dest('..\\build\\code'))
});

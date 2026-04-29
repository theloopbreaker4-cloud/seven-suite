/**
 * Project: Seven
 * Pseudonym: prgera
 * @author TheLoopBreaker <the.loop.breaker4@gmail.com>
 * File: gulpfile.js
 * Description: Gulp task configuration for synchronizing shared folder between frontend and backend
 * Created: 2025-10-26
 */

const gulp = require('gulp');

/**
 * Task: move-shared-backend
 * Copies all files from shared/ to backend/src/app/
 */
gulp.task('move-shared-backend', function () {
  return gulp
    .src('shared/**')
    .pipe(gulp.dest('./backend/src/app/'))
    .on('error', function (err) {
      console.error('❌ Error copying to backend:', err.message);
      this.emit('end');
    });
});

/**
 * Task: move-shared-frontend
 * Copies all files from shared/ to frontend/src/app/
 */
gulp.task('move-shared-frontend', function () {
  return gulp
    .src('shared/**')
    .pipe(gulp.dest('./frontend/src/app/'))
    .on('error', function (err) {
      console.error('❌ Error copying to frontend:', err.message);
      this.emit('end');
    });
});

/**
 * Task: move-shared
 * Executes both backend and frontend shared folder synchronization
 */
gulp.task(
  'move-shared',
  gulp.series('move-shared-backend', 'move-shared-frontend', function (done) {
    console.log('✓ Shared files synchronized to frontend and backend.');
    done();
  }),
);

/**
 * Task: watch
 * Watches shared/ folder for changes and auto-syncs to frontend/backend
 */
gulp.task('watch', function () {
  console.log('👀 Watching shared/ folder for changes...');
  gulp.watch('shared/**', { events: ['add', 'change', 'unlink'] }, function (cb) {
    console.log('🔄 Changes detected in shared/ folder, syncing...');
    gulp.series('move-shared-backend', 'move-shared-frontend', function (done) {
      console.log('✓ Sync completed.');
      done();
    })(cb);
  });
});

/**
 * Default task
 * Runs move-shared task
 */
gulp.task('default', gulp.series('move-shared'));
# Dev environment

FROM node:6.9.1-wheezy

RUN apt-get install -y git libfreetype6 libfontconfig

RUN npm -g install gulp-cli
RUN npm -g install nodemon

EXPOSE 80

CMD ["nodemon", "--watch", "gulpfile.js", "--watch", "webpack.config.js", "--", "./node_modules/.bin/gulp", "--port=80"]

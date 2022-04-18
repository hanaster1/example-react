const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');
const { join } = require('path');
const mongoose = require('mongoose');
const { ErrorsMiddleware } = require('./middleware/errors.middleware');
const { LoggerMiddleware } = require('./middleware/logger.middleware');
const SocketServer = require('./socketServer');
class AppServer {
  _app = express();
  _port = 5000;
  _server;

  constructor(controllers = []) {
    dotenv.config();
    this.connectionDatabase();
    this.initMiddleWares();
    this.initLogger();
    this.initializeControllers(controllers);
    this.initErrorHandling();
  }

  buildCorsOpt() {
    const configCors = process.env.CORS_ALLOW_ORIGINS;
    if (!configCors) {
      throw new Error('ENV CORS not provider!');
    }
    return {
      origin: configCors.toString().split(','),
      methods: 'OPTIONS,GET,HEAD,PUT,PATCH,POST,DELETE',
      preflightContinue: false,
      optionsSuccessStatus: 204,
      credentials: true,
    };
  }

  initMiddleWares() {
    this._app.use(cors(this.buildCorsOpt()));
    this._app.use(bodyParser.json());
    this._app.use(express.static(join(__dirname, 'build')));
  }

  initErrorHandling() {
    this._app.use(ErrorsMiddleware);
  }

  initLogger() {
    this._app.use(LoggerMiddleware);
  }

  connectionDatabase() {
    const mongoUrl = process.env.MONGO_URL;
    mongoose.connect(mongoUrl, {
      autoCreate: true,
      autoIndex: true,
    });
  }

  initializeControllers(controllers = []) {
    controllers.forEach((c) => {
      this._app.use('/', c._router);
    });
  }

  startListening() {
    const PORT = process.env.PORT || this._port;
    this._server = this._app.listen(PORT, () => {
      console.log(`server started on ${PORT}!`);
    });
    new SocketServer(this._server);
  }
}

module.exports = AppServer;
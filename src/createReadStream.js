/*
 * @Descripttion: your project
 * @version: 1.0
 * @Author: power_840
 * @Date: 2021-04-10 09:34:47
 * @LastEditors: power_840
 * @LastEditTime: 2021-04-10 10:14:30
 */

const fs = require("fs");
const EventEmitter = require("events");

class ReadStream extends EventEmitter {
  constructor(path, options = {}) {
    super();
    this.path = path;
    this.options = options;
    this.flags = options.flags || "r";
    this.encoding = options.encoding || null;
    this.autoClose = options.autoClose || true;
    this.start = options.start || 0;
    this.end = options.end;
    this.highWaterMark = options.highWaterMark || 64 * 1024;

    this.offset = this.start;

    this.open();

    this.addListener("newListener", (type) => {
      if (type === "data") {
        this.read();
      }
    });
  }
  open() {
    fs.open(this.path, this.flags, (err, fd) => {
      if (err) {
        return this.destory(err);
      }
      this.fd = fd;
      this.emit("open", fd);
    });
  }
  read() {
    if (typeof this.fd !== "number") {
      return this.once("open", () => this.read());
    }
    let buffer = Buffer.alloc(this.highWaterMark);
    fs.read(
      this.fd,
      buffer,
      this.start,
      this.highWaterMark,
      this.offset,
      (err, byteRead) => {
        // 具体读了多少个, 可能会比highWaterMark要小
        if (byteRead) {
          this.offset += byteRead;
          this.emit("data", buffer.slice(0, byteRead));
          this.read();
        } else {
          this.emit("end");
          this.destory();
        }
      }
    );
  }
  destory(err) {
    if (err) {
      this.emit(err);
    }
    if (this.autoClose) {
      fs.close(this.fd, () => {
        this.emit("close");
      });
    }
  }
}

module.exports = ReadStream;

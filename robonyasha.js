function getRandomInt(max) {
    return Math.floor(Math.random() * max);
}

class Robonyasha {

    constructor() {
        this.ledLamp = require("@amperka/led").connect(P1);
        this.leftAnalogSensor = require("@amperka/analog-line-sensor").connect(A0);
        this.rightAnalogSensor = require("@amperka/analog-line-sensor").connect(A1);
        this.motor = require("@amperka/robot-2wd").connect();
        this.irReceiver = require("@amperka/ir-receiver").connect(P3);
        this.servo = require("@amperka/servo").connect(P8);
        this.ultraSonic = require("@amperka/ultrasonic").connect({trigPin: P12, echoPin: P13});
        this.digitalLineSensor = require("@amperka/digital-line-sensor").connect(P10);
        this.lineFollower = require("@amperka/pid").create({
            target: 0,
            kp: 0.35,
            ki: 0.05,
            kd: 1.5,
            outputMin: -1.5,
            outputMax: 1.5
        });

        this.MAX_SPEED = 1;
        this.MIN_SPEED = 0.3;
        this.MAX_DISTANCE = 20;
        this.MIN_DISTANCE = 10;

        this.return_distance = 0;

        this.speed = this.MIN_SPEED;
        this.servo.write(90);  // straight position of the neck
    }

    dance() {
        this.reset();
        setTimeout((robot) => {
            robot.motor.go({'l': -robot.speed, 'r': -robot.speed});
            robot.ledLamp.toggle();
            robot.servo.write(30);
        }, 0, this);
        setTimeout((robot) => {
            robot.motor.go({'l': robot.speed, 'r': robot.speed});
            robot.ledLamp.toggle();
            robot.servo.write(90);
        }, 1000, this);
        setTimeout((robot) => {
            robot.motor.go({'l': robot.speed, 'r': -robot.speed});
            robot.ledLamp.toggle();
            robot.servo.write(150);
        }, 2000, this);
        setTimeout((robot) => {
            robot.motor.go({'l': -robot.speed, 'r': robot.speed});
            robot.ledLamp.toggle();
            robot.servo.write(90);
        }, 3000, this);
        setTimeout((robot) => {
            robot.motor.stop();
        }, 4000, this);
    }

    bottle() {
        this.reset();
        setTimeout((robot) => {
            robot.motor.go({'l': -robot.speed, 'r': robot.speed});
            robot.ledLamp.toggle();
        }, 0, this);
        setTimeout((robot) => {
            robot.motor.stop();
            robot.ledLamp.toggle();
        }, getRandomInt(10000), this);

        this.digitalLineSensor.on("white", () => {
            this.return_distance += 1;
        });
        var interval = setInterval(donotBump, 100, this);
        var donotBump = (robot) => {
            robot.ultraSonic.ping(function(error, value) {
                if (!error) {
                    robot.dontBump(value, interval);
                }
            }, 'cm');
        };
        setTimeout((robot) => {
            robot.digitalLineSensor.on("white", () => {
                robot.return_distance -= 1;
            });
            while (robot.return_distance > 0) {
                robot.motor.go({'l': robot.speed, 'r': robot.speed});
            }
            lineSensor.on("white", () => {});
        }, 1000, this);
    }

    dontBump(currentDistance, interval) {
        if (currentDistance > this.MAX_DISTANCE) {
            this.motor.go({'l': -this.speed, 'r': -this.speed});
        } else {
            this.motor.stop();
            clearInterval(interval);
        }
    }

    followHand() {
        this.reset();
        setInterval((robot) => {
            robot.ultraSonic.ping(function(error, value) {
                if (!error) {
                    robot.keepDistance(value);
                }
            }, 'cm');
        }, 100, this);
    }

    keepDistance(currentDistance) {
        if (currentDistance > this.MAX_DISTANCE) {
            this.motor.go({'l': -this.speed, 'r': -this.speed});
        } else if (currentDistance < this.MIN_DISTANCE) {
            this.motor.go({'l': this.speed, 'r': this.speed});
        } else {
            this.motor.stop();
            print(currentDistance);
        }
    }

    followLine() {
        this.reset();
        this.lineFollower.run(() => {
            let right = this.rightAnalogSensor.read();
            let left = this.leftAnalogSensor.read();
            let error = left - right;
            let output = this.lineFollower.update(error);
            this.motor.go({'l': -this.speed - output, 'r': -this.speed + output});
        }, 0.02);
    }

    sumoFight() {
        this.reset();
        print("NOT IMPLEMENTED!");
    }

    increaseSpeed(step) {
        this.speed += step;
        if (this.speed > this.MAX_SPEED) {
            this.speed = this.MAX_SPEED;
        }
    }

    decreaseSpeed(step) {
        this.speed -= step;
        if (this.speed > this.MIN_SPEED) {
            this.speed = this.MIN_SPEED;
        }
    }

    reset() {
        print("RESET");
        // Get a reference to the last interval + 1
        const interval_id = setInterval(function(){}, Number.MAX_SAFE_INTEGER);

        // Clear any timeout/interval up to that id
        for (let i = 1; i < interval_id; i++) {
            clearInterval(i);
        }
        this.ledLamp.turnOff();
        this.motor.stop();
        this.lineFollower.stop();
        this.servo.write(90);
        this.return_distance = 0;
    }

}


function main() {
    let robot = new Robonyasha();
    robot.irReceiver.on('receive', function(code) {
        switch(code) {
            case robot.irReceiver.keys.TOP:
                print("dance");
                robot.dance();
                break;
            case robot.irReceiver.keys.BOTTOM:
                print("sumo");
                robot.sumoFight();
                break;
            case robot.irReceiver.keys.LEFT:
                print("hand");
                robot.followHand();
                break;
            case robot.irReceiver.keys.RIGHT:
                print("line");
                robot.followLine();
                break;
            case robot.irReceiver.keys.PLAY:
                print("bottle");
                robot.bottle();
                break;
            case robot.irReceiver.keys.PLUS:
                print("+");
                robot.increaseSpeed(0.1);
                break;
            case robot.irReceiver.keys.MINUS:
                print("-");
                robot.decreaseSpeed(0.1);
                break;
            case robot.irReceiver.keys.POWER:
                print("off");
                robot.reset();
                break;
            default: break;
        }
    });
}

main();

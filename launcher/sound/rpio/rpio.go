package rpio

import (
	"log"

	"github.com/stianeikeland/go-rpio/v4"
)

func InitialiseRPIO() error {
	log.Println("initialising RPIO")
	err := rpio.Open()
	if err != nil {
		return err
	}
	rpio.StartPwm()
	return nil
}

func ShutdownRPIO() error {
	log.Println("shutting down RPIO")
	rpio.StopPwm()
	return rpio.Close()
}

type PWMToneGenerator struct {
	pin rpio.Pin
}

func NewPWMToneGenerator(pinNumber int) PWMToneGenerator {
	log.Printf("setting up PWM on pin %v", pinNumber)
	pin := rpio.Pin(pinNumber)
	pin.Pwm()
	return PWMToneGenerator{pin: pin}
}

func (tg PWMToneGenerator) PlayFreq(freq float32) {
	// Notes are not integers, so we need to round.
	// I bet we can do something clever here to get the fractional notes to sound better.
	tg.pin.Freq(int(freq * 32))
	tg.pin.DutyCycle(1, 32)
}

func (tg PWMToneGenerator) Silence() {
	tg.pin.DutyCycle(0, 0)
}

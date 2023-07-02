package rpio

import (
	"log"
	"time"

	"github.com/stianeikeland/go-rpio/v4"
)

func InitialiseRPIO() error {
	log.Println("initialising RPIO")
	err := rpio.Open()
	if err != nil {
		return err
	}
	return nil
}

func ShutdownRPIO() error {
	log.Println("shutting down RPIO")
	rpio.StopPwm()
	return rpio.Close()
}

type PWMToneGenerator struct {
	pin             rpio.Pin
	cycleMultiplier float32
	duty            uint32
}

func NewPWMToneGenerator(pinNumber, duty int) PWMToneGenerator {
	log.Printf("setting up PWM on pin %v", pinNumber)
	pin := rpio.Pin(pinNumber)
	return PWMToneGenerator{
		pin:             pin,
		cycleMultiplier: float32(duty),
		duty:            uint32(duty),
	}
}

func (tg PWMToneGenerator) PlayFreq(freq float32, duration time.Duration) {
	// Notes are not integers, so we need to round.
	// I bet we can do something clever here to get the fractional notes to sound better.
	tg.pin.Pwm()
	tg.pin.Freq(int(freq * tg.cycleMultiplier))
	tg.pin.DutyCycle(1, tg.duty)
	rpio.StartPwm()
	time.Sleep(duration)
	rpio.StopPwm()
}

func (tg PWMToneGenerator) Silence(duration time.Duration) {
	// tg.pin.DutyCycle(0, 0)
	time.Sleep(duration)
}

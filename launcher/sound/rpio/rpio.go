package rpio

import "github.com/stianeikeland/go-rpio/v4"

const pwmClockFreq = 1000000

func InitialiseRPIO() error {
	return rpio.Open()
}

func ShutdownRPIO() error {
	return rpio.Close()
}

type PWMToneGenerator struct {
	pin       rpio.Pin
	dutyCycle uint32
}

func NewPWMToneGenerator(pinNumber int, dutyCycle uint32) PWMToneGenerator {
	pin := rpio.Pin(pinNumber)
	pin.Pwm()
	pin.Mode(rpio.Pwm)
	return PWMToneGenerator{pin: pin, dutyCycle: dutyCycle}
}

func (tg PWMToneGenerator) PlayFreq(freq float32) {
	// Notes are not integers, so we need to round.
	// I bet we can do something clever here to get the fractional notes to sound better.
	cycle := uint32(pwmClockFreq / freq)
	tg.pin.DutyCycle(tg.dutyCycle, cycle)
	tg.pin.Freq(int(freq))
}

func (tg PWMToneGenerator) Silence() {
	tg.pin.DutyCycle(0, 0)
}

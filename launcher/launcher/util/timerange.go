package util

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func IsInHourRange(timeRange string) (bool, error) {
	unmuteHours, err := ParseHourRange(timeRange)
	if err != nil {
		return false, fmt.Errorf("failed to parse hour range: %w", err)
	}
	startHour := unmuteHours[0]
	endHour := unmuteHours[1]
	currentTime := time.Now()
	isInRange := currentTime.Hour() >= startHour && currentTime.Hour() < endHour
	return isInRange, nil
}

func ParseHourRange(timeRange string) ([2]int, error) {
	hours := [2]int{}
	if timeRange == "" {
		return hours, fmt.Errorf("time range is empty")
	}
	// unmuteRange is startHour-endHour
	unmuteRangeParts := strings.Split(timeRange, "-")
	if len(unmuteRangeParts) != 2 {
		return hours, fmt.Errorf("invalid unmute range %v", timeRange)
	}
	for i, part := range unmuteRangeParts {
		hour, err := strconv.ParseInt(part, 10, 32)
		if err != nil {
			return hours, fmt.Errorf("invalid unmute range %v", timeRange)
		}
		hours[i] = int(hour)
	}
	return hours, nil
}

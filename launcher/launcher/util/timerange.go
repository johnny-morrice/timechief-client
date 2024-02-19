package util

import (
	"fmt"
	"strconv"
	"strings"
	"time"
)

func IsInHourRange(timeRange string) (bool, error) {
	if timeRange == "" {
		return false, fmt.Errorf("time range is empty")
	}
	// unmuteRange is startHour-endHour
	unmuteRangeParts := strings.Split(timeRange, "-")
	if len(unmuteRangeParts) != 2 {
		return false, fmt.Errorf("invalid unmute range %v", timeRange)
	}
	unmuteHours := [2]int{}
	for i, part := range unmuteRangeParts {
		unmuteHour, err := strconv.ParseInt(part, 10, 32)
		if err != nil {
			return false, fmt.Errorf("invalid unmute range %v", timeRange)
		}
		unmuteHours[i] = int(unmuteHour)
	}
	startHour := unmuteHours[0]
	endHour := unmuteHours[1]
	currentTime := time.Now()
	isInRange := currentTime.Hour() >= startHour && currentTime.Hour() < endHour
	return isInRange, nil
}

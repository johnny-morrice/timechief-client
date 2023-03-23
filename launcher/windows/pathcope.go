package windows

import (
	"regexp"
	"strings"
)

// PathCope takes a windows path that may begin with a drive letter and returns a path in a format that can be used by git-bash utilities such as tar.
func PathCope(winPath string) string {
	driveLetterRegex := regexp.MustCompile(`^([a-zA-Z]):`)
	linuxPath := driveLetterRegex.ReplaceAllString(winPath, "/$1")
	linuxPath = strings.ReplaceAll(linuxPath, `\`, `/`)
	return linuxPath
}

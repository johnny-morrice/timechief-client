package mascot

import (
	"embed"
	"fmt"
	"image"
	"image/color"
	"image/png"
	"os"
	"path/filepath"
	"strings"
)

//go:embed images/*
var images embed.FS

func transformImage(imageFileName, targetDark, targetLight string) error {
	// Read the image data from the embedded filesystem
	imageData, err := images.ReadFile("images/" + imageFileName)
	if err != nil {
		return fmt.Errorf("failed to read image: %w", err)
	}

	// Decode the image
	img, _, err := image.Decode(strings.NewReader(string(imageData)))
	if err != nil {
		return fmt.Errorf("failed to decode image: %w", err)
	}

	// Parse the target colors
	darkColor, err := parseHexColor(targetDark)
	if err != nil {
		return fmt.Errorf("invalid target dark color: %w", err)
	}
	lightColor, err := parseHexColor(targetLight)
	if err != nil {
		return fmt.Errorf("invalid target light color: %w", err)
	}

	// Create a new image with the same dimensions
	bounds := img.Bounds()
	newImg := image.NewRGBA(bounds)

	// Transform the image
	for y := bounds.Min.Y; y < bounds.Max.Y; y++ {
		for x := bounds.Min.X; x < bounds.Max.X; x++ {
			c := img.At(x, y)
			r, g, b, a := c.RGBA()
			if r == 0 && g == 0 && b == 65535 { // Pure blue
				newImg.Set(x, y, darkColor)
			} else if a == 0 { // Transparent
				newImg.Set(x, y, lightColor)
			} else {
				newImg.Set(x, y, c)
			}
		}
	}

	// Ensure the output directory exists
	outputDir := "/opt/timechief-launcher/media/mascot"
	if err := os.MkdirAll(outputDir, 0755); err != nil {
		return fmt.Errorf("failed to create output directory: %w", err)
	}

	// Write the output image to the final destination
	outputFilePath := filepath.Join(outputDir, imageFileName)
	outputFile, err := os.Create(outputFilePath)
	if err != nil {
		return fmt.Errorf("failed to create output file: %w", err)
	}
	defer outputFile.Close()

	if err := png.Encode(outputFile, newImg); err != nil {
		return fmt.Errorf("failed to encode output image: %w", err)
	}

	fmt.Printf("Image conversion complete. Saved as %s\n", outputFilePath)
	return nil
}

func parseHexColor(s string) (color.Color, error) {
	c := color.RGBA{A: 0xff}
	switch len(s) {
	case 7:
		_, err := fmt.Sscanf(s, "#%02x%02x%02x", &c.R, &c.G, &c.B)
		return c, err
	case 9:
		_, err := fmt.Sscanf(s, "#%02x%02x%02x%02x", &c.R, &c.G, &c.B, &c.A)
		return c, err
	}
	return c, fmt.Errorf("invalid length, must be 7 or 9")
}

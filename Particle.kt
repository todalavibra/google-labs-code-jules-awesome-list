package com.example.myapp.presentation.model

import android.graphics.Color

data class Particle(
    var x: Float,
    var y: Float,
    var color: Int,
    var radius: Float,
    var xSpeed: Float,
    var ySpeed: Float,
    var alpha: Int = 255,
    var lifetime: Int // e.g., in frames or milliseconds
) {
    companion object {
        // Predefined rainbow colors for Rainbow Burst effect
        val RAINBOW_COLORS = listOf(
            Color.RED, Color.rgb(255, 165, 0), Color.YELLOW, // Orange
            Color.GREEN, Color.BLUE, Color.rgb(75, 0, 130), // Indigo
            Color.rgb(128, 0, 128) // Violet
        )
    }
}

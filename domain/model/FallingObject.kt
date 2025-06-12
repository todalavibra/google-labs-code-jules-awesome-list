package com.example.myapp.domain.model

enum class ObjectType {
    TOY, FRUIT, BLOCK
}

data class FallingObject(
    var x: Float,
    var y: Float,
    val type: ObjectType,
    var size: Float,
    var speed: Float,
    var isShredding: Boolean = false, // For shred animation
    var alpha: Int = 255 // For fade out animation
)

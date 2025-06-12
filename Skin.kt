package com.example.myapp.domain.model

import androidx.annotation.DrawableRes

data class Skin(
    val id: String,
    val name: String,
    @DrawableRes val iconResId: Int, // For displaying the skin in a list
    var isUnlocked: Boolean,
    val unlockCost: Int, // 0 if unlocked by default or through non-coin means
    // Potentially, add fields for actual visual assets if not just a color tint
    // e.g., val mainColor: Int? = null, val detailColor: Int? = null, val spriteName: String? = null
)

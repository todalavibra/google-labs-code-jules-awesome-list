import pygame
import random

# Initialize Pygame
pygame.init()

# Screen dimensions
SCREEN_WIDTH = 800
SCREEN_HEIGHT = 600

# Window title
WINDOW_TITLE = "Shredder Game"

# Create the game screen
screen = pygame.display.set_mode((SCREEN_WIDTH, SCREEN_HEIGHT))
pygame.display.set_caption(WINDOW_TITLE)

# Colors
WHITE = (255, 255, 255)
BLACK = (0, 0, 0)
RED = (255, 0, 0)
GRAY = (128, 128, 128)
DARKGRAY = (169, 169, 169)

# Frame rate
FPS = 60
clock = pygame.time.Clock()

# FallingObject class
class FallingObject:
    def __init__(self, x, y, width, height, color, speed):
        self.rect = pygame.Rect(x, y, width, height)
        self.color = color
        self.speed = speed

    def move(self):
        self.rect.y += self.speed

    def draw(self, surface):
        pygame.draw.rect(surface, self.color, self.rect)

# List to hold active falling objects
falling_objects = []

# Timer for spawning new objects (e.g., spawn every 1 second)
SPAWN_INTERVAL = 1000  # milliseconds
last_spawn_time = pygame.time.get_ticks()

# Shredder class
class Shredder:
    MAX_UPGRADE_LEVEL = 2

    def __init__(self, x, y, width, height, color):
        self.rect = pygame.Rect(x, y, width, height)
        self.color = color
        self.blade_color = DARKGRAY
        self.blades = []
        self.upgrade_level = 0
        self._update_blades()  # Initial blade setup

    def _update_blades(self):
        self.blades.clear()  # Clear existing blades before recalculating

        if self.upgrade_level == 0:
            blade_count = 3
        elif self.upgrade_level == 1:
            blade_count = 4
        else:  # Max upgrade level
            blade_count = 5

        blade_height = 10  # Blades are not very tall

        if blade_count == 0: # Should not happen with current logic, but good for safety
            return

        # Dynamic calculation for blade width and spacing
        # Let gaps be a certain fraction of the blade width, e.g., 1/4.
        # Total width = blade_count * blade_width + (blade_count + 1) * gap_width
        # Let gap_width = blade_width / 4
        # Total width = blade_count * blade_width + (blade_count + 1) * (blade_width / 4)
        # Total width = blade_width * (blade_count + (blade_count + 1) / 4)
        # blade_width = Total_width / (blade_count + (blade_count + 1) / 4)

        # Using a simpler approach: allocate 80% of width to blades, rest to gaps
        total_blades_zone_width = self.rect.width * 0.85 # Use 85% of shredder width for blades area
        total_gap_width = self.rect.width * 0.15 # Use 15% for gaps

        if blade_count > 0:
            gap_width = total_gap_width / (blade_count + 1)
            actual_blade_width = total_blades_zone_width / blade_count
        else: # Avoid division by zero if blade_count is somehow 0
            gap_width = 0
            actual_blade_width = 0


        current_x = self.rect.x + gap_width
        for _ in range(blade_count):
            blade_y = self.rect.y
            self.blades.append(pygame.Rect(current_x, blade_y, actual_blade_width, blade_height))
            current_x += actual_blade_width + gap_width

    def upgrade(self):
        if self.upgrade_level < self.MAX_UPGRADE_LEVEL:
            self.upgrade_level += 1
            self._update_blades()

    def draw(self, surface):
        # Draw the main body
        pygame.draw.rect(surface, self.color, self.rect)
        # Draw the blades
        for blade in self.blades:
            pygame.draw.rect(surface, self.blade_color, blade)

# Create Shredder instance
shredder_width = 200 # Width of the shredder body
shredder_height = 50 # Height of the shredder body
shredder_x = (SCREEN_WIDTH - shredder_width) // 2
shredder_y = SCREEN_HEIGHT - shredder_height # Positioned at the bottom
shredder = Shredder(shredder_x, shredder_y, shredder_width, shredder_height, GRAY)

# Score
score = 0
font = pygame.font.Font(None, 36) # Default font, size 36

# Main game loop
running = True
while running:
    # Event handling
    for event in pygame.event.get():
        if event.type == pygame.QUIT:
            running = False
        if event.type == pygame.KEYDOWN:
            if event.key == pygame.K_u:
                shredder.upgrade()

    # Spawn new falling objects
    current_time = pygame.time.get_ticks()
    if current_time - last_spawn_time > SPAWN_INTERVAL:
        obj_width = 50
        obj_height = 50
        obj_x = random.randint(0, SCREEN_WIDTH - obj_width)
        obj_y = 0
        obj_color = RED
        obj_speed = 5
        new_object = FallingObject(obj_x, obj_y, obj_width, obj_height, obj_color, obj_speed)
        falling_objects.append(new_object)
        last_spawn_time = current_time

    # Move falling objects and check for collisions
    for obj in falling_objects[:]:  # Iterate over a copy for safe removal
        obj.move()

        # Check for collision with shredder blades
        shredded = False
        for blade_rect in shredder.blades:
            if obj.rect.colliderect(blade_rect):
                falling_objects.remove(obj)
                score += 10 # Increment score
                shredded = True
                break  # Object shredded, no need to check other blades or screen bottom

        if shredded:
            continue # Move to the next object

        # Remove objects that fall off the bottom of the screen
        if obj.rect.top > SCREEN_HEIGHT:
            falling_objects.remove(obj)

    # Fill the screen
    screen.fill(WHITE)

    # Draw all active objects
    for obj in falling_objects:
        obj.draw(screen)

    # Draw the shredder
    shredder.draw(screen)

    # Display the score
    score_surface = font.render(f"Score: {score}", True, BLACK)
    score_rect = score_surface.get_rect()
    score_rect.topleft = (10, 10)
    screen.blit(score_surface, score_rect)

    # Update the display
    pygame.display.flip()

    # Control frame rate
    clock.tick(FPS)

# Quit Pygame
pygame.quit()

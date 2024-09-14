from django.db import models
from django.core.exceptions import ValidationError
from django.utils.translation import gettext_lazy as _

# Validación de edad para mayor de 18 años
def validate_age(value):
    if value < 18:
        raise ValidationError(_('La edad debe ser mayor o igual a 18 años.'))

class Usuario(models.Model):
    username = models.CharField(max_length=150, unique=True)
    run = models.CharField(max_length=10, unique=True)
    nombre = models.CharField(max_length=100)
    apellido_paterno = models.CharField(max_length=100)
    apellido_materno = models.CharField(max_length=100)
    edad = models.IntegerField(validators=[validate_age])
    pais = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=128)

    def __str__(self):
        return f'{self.username} ({self.run})'
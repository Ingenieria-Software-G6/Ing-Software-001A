from django import forms
from .models import Usuario
from django.core.exceptions import ValidationError

class RegistroForm(forms.ModelForm):
    password = forms.CharField(widget=forms.PasswordInput)
    password2 = forms.CharField(widget=forms.PasswordInput, label="Confirmar contraseña")

    class Meta:
        model = Usuario
        fields = ['username', 'run', 'nombre', 'apellido_paterno', 'apellido_materno', 'edad', 'pais', 'email', 'password']

    # Validar que ambas contraseñas coinciden
    def clean_password2(self):
        password1 = self.cleaned_data.get("password")
        password2 = self.cleaned_data.get("password2")
        if password1 and password2 and password1 != password2:
            raise ValidationError("Las contraseñas no coinciden.")
        return password2

    # Guardar la contraseña encriptada
    def save(self, commit=True):
        user = super().save(commit=False)
        user.set_password(self.cleaned_data["password"])
        if commit:
            user.save()
        return user
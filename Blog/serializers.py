from rest_framework import serializers
from .models import Post


class PostSerializer(serializers.ModelSerializer):
    author = serializers.StringRelatedField()

    class Meta:
        model = Post
        fields = [
            'id',
            'title',
            'slug',
            'author',
            'content',
            'image',
            'created_on',
            'updated_on',
        ]
from setuptools import setup

setup(name='pyrtc',
      version='0.0.1',
      description='Python RTC application for timechief',
      url='https://github.com/johnny-morrice/timechief-client/',
      author='Johnny Morrice',
      author_email='john.morrice.developer@gmail.com',
      license='All Rights Reserved',
      packages=['pyrtc'],
      install_requires=[
          'rv3028',
          'smbus'
      ],
      zip_safe=False)
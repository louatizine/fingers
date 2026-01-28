Imports System
Imports System.Collections.Generic
Imports System.ComponentModel
Imports System.Data
Imports System.Drawing
Imports System.Text
Imports System.Windows.Forms

Namespace VBNETSample
	Partial Public Class UserInfoForm
		Inherits Form
		Public Sub New()
			InitializeComponent()
		End Sub

		Public Property UserName() As String
			Get
				Return lblUserName.Text
			End Get
			Set(ByVal value As String)
				lblUserName.Text = Value
			End Set
		End Property

		Public Property UserFingerprintImage() As Image
			Get
				Return pbUserFinger.Image
			End Get
			Set(ByVal value As Image)
				pbUserFinger.Image = Value
			End Set
		End Property
	End Class
End Namespace
